from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from .models import (Project, Domain, Paper, Problem, Hypothesis,
                     Feasibility, Proposal, ResearchLog, ThesisChapter)
from .serializers import (ProjectSerializer, DomainSerializer, PaperSerializer,
                           ProblemSerializer, HypothesisSerializer, FeasibilitySerializer,
                           ProposalSerializer, ResearchLogSerializer, ThesisChapterSerializer)


class ProjectViewSet(viewsets.ModelViewSet):
    queryset = Project.objects.all().order_by('-created_at')
    serializer_class = ProjectSerializer

    @action(detail=True, methods=['get'])
    def dashboard(self, request, pk=None):
        project = self.get_object()
        papers = project.papers.count()
        problems = project.problems.count()
        hypotheses = project.hypotheses.count()
        logs = project.logs.count()
        has_domain = hasattr(project, 'domain')
        has_feasibility = hasattr(project, 'feasibility')
        has_proposal = hasattr(project, 'proposal')
        thesis_words = sum(
            c.word_count for c in project.thesis_chapters.all()
        )
        proposal_pct = 0
        if has_proposal:
            p = project.proposal
            fields = ['title_abstract','introduction','lit_review_summary',
                      'problem_statement','hypothesis_section','methodology',
                      'timeline','resources','expected_contribution','references']
            filled = sum(1 for f in fields if len(getattr(p, f, '') or '') > 30)
            proposal_pct = round(filled / len(fields) * 100)

        return Response({
            'papers': papers,
            'problems': problems,
            'hypotheses': hypotheses,
            'logs': logs,
            'has_domain': has_domain,
            'has_feasibility': has_feasibility,
            'has_proposal': has_proposal,
            'thesis_words': thesis_words,
            'proposal_pct': proposal_pct,
        })


class DomainViewSet(viewsets.ModelViewSet):
    serializer_class = DomainSerializer

    def get_queryset(self):
        project_id = self.kwargs.get('project_pk')
        return Domain.objects.filter(project_id=project_id)

    def perform_create(self, serializer):
        project_id = self.kwargs.get('project_pk')
        serializer.save(project_id=project_id)

    @action(detail=False, methods=['get', 'put', 'patch', 'post'])
    def current(self, request, project_pk=None):
        project = get_object_or_404(Project, pk=project_pk)
        try:
            domain = project.domain
            if request.method == 'GET':
                return Response(DomainSerializer(domain).data)
            serializer = DomainSerializer(domain, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response(serializer.data)
        except Domain.DoesNotExist:
            if request.method == 'GET':
                return Response({}, status=status.HTTP_204_NO_CONTENT)
            serializer = DomainSerializer(data={**request.data, 'project': project.pk})
            serializer.is_valid(raise_exception=True)
            serializer.save(project=project)
            return Response(serializer.data, status=status.HTTP_201_CREATED)


class PaperViewSet(viewsets.ModelViewSet):
    serializer_class = PaperSerializer

    def get_queryset(self):
        qs = Paper.objects.filter(project_id=self.kwargs.get('project_pk'))
        relevance = self.request.query_params.get('relevance')
        search = self.request.query_params.get('search')
        if relevance:
            qs = qs.filter(relevance=relevance)
        if search:
            qs = qs.filter(title__icontains=search) | qs.filter(authors__icontains=search) | qs.filter(tags__icontains=search)
        return qs

    def perform_create(self, serializer):
        serializer.save(project_id=self.kwargs.get('project_pk'))


class ProblemViewSet(viewsets.ModelViewSet):
    serializer_class = ProblemSerializer

    def get_queryset(self):
        qs = Problem.objects.filter(project_id=self.kwargs.get('project_pk'))
        status_filter = self.request.query_params.get('status')
        if status_filter:
            qs = qs.filter(status=status_filter)
        return qs

    def perform_create(self, serializer):
        serializer.save(project_id=self.kwargs.get('project_pk'))


class HypothesisViewSet(viewsets.ModelViewSet):
    serializer_class = HypothesisSerializer

    def get_queryset(self):
        return Hypothesis.objects.filter(project_id=self.kwargs.get('project_pk'))

    def perform_create(self, serializer):
        serializer.save(project_id=self.kwargs.get('project_pk'))

    @action(detail=True, methods=['post'])
    def select(self, request, project_pk=None, pk=None):
        hyp = self.get_object()
        # Deselect all others first
        Hypothesis.objects.filter(project_id=project_pk).update(is_selected=False)
        hyp.is_selected = True
        hyp.save()
        return Response(HypothesisSerializer(hyp).data)

    @action(detail=False, methods=['post'])
    def update_elo(self, request, project_pk=None):
        """Update Elo ratings after a matchup between two hypotheses."""
        winner_id = request.data.get('winner_id')
        loser_id = request.data.get('loser_id')
        if not winner_id or not loser_id:
            return Response({'error': 'winner_id and loser_id required'}, status=400)
        winner = get_object_or_404(Hypothesis, pk=winner_id, project_id=project_pk)
        loser = get_object_or_404(Hypothesis, pk=loser_id, project_id=project_pk)
        K = 32
        expected_w = 1 / (1 + 10 ** ((loser.elo_rating - winner.elo_rating) / 400))
        expected_l = 1 - expected_w
        winner.elo_rating = round(winner.elo_rating + K * (1 - expected_w))
        loser.elo_rating = round(loser.elo_rating + K * (0 - expected_l))
        winner.save()
        loser.save()
        return Response({
            'winner': HypothesisSerializer(winner).data,
            'loser': HypothesisSerializer(loser).data,
        })


class FeasibilityViewSet(viewsets.ModelViewSet):
    serializer_class = FeasibilitySerializer

    def get_queryset(self):
        return Feasibility.objects.filter(project_id=self.kwargs.get('project_pk'))

    def perform_create(self, serializer):
        serializer.save(project_id=self.kwargs.get('project_pk'))

    @action(detail=False, methods=['get', 'put', 'patch', 'post'])
    def current(self, request, project_pk=None):
        project = get_object_or_404(Project, pk=project_pk)
        try:
            feas = project.feasibility
            if request.method == 'GET':
                return Response(FeasibilitySerializer(feas).data)
            serializer = FeasibilitySerializer(feas, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response(serializer.data)
        except Feasibility.DoesNotExist:
            if request.method == 'GET':
                return Response({}, status=status.HTTP_204_NO_CONTENT)
            serializer = FeasibilitySerializer(data={**request.data, 'project': project.pk})
            serializer.is_valid(raise_exception=True)
            serializer.save(project=project)
            return Response(serializer.data, status=status.HTTP_201_CREATED)


class ProposalViewSet(viewsets.ModelViewSet):
    serializer_class = ProposalSerializer

    def get_queryset(self):
        return Proposal.objects.filter(project_id=self.kwargs.get('project_pk'))

    def perform_create(self, serializer):
        serializer.save(project_id=self.kwargs.get('project_pk'))

    @action(detail=False, methods=['get', 'put', 'patch', 'post'])
    def current(self, request, project_pk=None):
        project = get_object_or_404(Project, pk=project_pk)
        try:
            proposal = project.proposal
            if request.method == 'GET':
                return Response(ProposalSerializer(proposal).data)
            serializer = ProposalSerializer(proposal, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response(serializer.data)
        except Proposal.DoesNotExist:
            if request.method == 'GET':
                return Response({}, status=status.HTTP_204_NO_CONTENT)
            serializer = ProposalSerializer(data={**request.data, 'project': project.pk})
            serializer.is_valid(raise_exception=True)
            serializer.save(project=project)
            return Response(serializer.data, status=status.HTTP_201_CREATED)


class ResearchLogViewSet(viewsets.ModelViewSet):
    serializer_class = ResearchLogSerializer

    def get_queryset(self):
        qs = ResearchLog.objects.filter(project_id=self.kwargs.get('project_pk'))
        phase = self.request.query_params.get('phase')
        if phase:
            qs = qs.filter(phase=phase)
        return qs

    def perform_create(self, serializer):
        serializer.save(project_id=self.kwargs.get('project_pk'))


class ThesisChapterViewSet(viewsets.ModelViewSet):
    serializer_class = ThesisChapterSerializer

    def get_queryset(self):
        return ThesisChapter.objects.filter(project_id=self.kwargs.get('project_pk'))

    def perform_create(self, serializer):
        serializer.save(project_id=self.kwargs.get('project_pk'))

    @action(detail=False, methods=['get', 'put', 'patch', 'post'])
    def by_key(self, request, project_pk=None):
        chapter_key = request.data.get('chapter_key') or request.query_params.get('chapter_key')
        if not chapter_key:
            return Response({'error': 'chapter_key required'}, status=400)
        project = get_object_or_404(Project, pk=project_pk)
        obj, created = ThesisChapter.objects.get_or_create(
            project=project, chapter_key=chapter_key,
            defaults={'content': ''}
        )
        if request.method == 'GET':
            return Response(ThesisChapterSerializer(obj).data)
        serializer = ThesisChapterSerializer(obj, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)
