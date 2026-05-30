from rest_framework import serializers
from .models import (Project, Domain, Paper, Problem, Hypothesis,
                     Feasibility, Proposal, ResearchLog, ThesisChapter)


class DomainSerializer(serializers.ModelSerializer):
    class Meta:
        model = Domain
        fields = '__all__'


class PaperSerializer(serializers.ModelSerializer):
    class Meta:
        model = Paper
        fields = '__all__'


class ProblemSerializer(serializers.ModelSerializer):
    hypotheses_count = serializers.SerializerMethodField()

    class Meta:
        model = Problem
        fields = '__all__'

    def get_hypotheses_count(self, obj):
        return obj.hypotheses.count()


class HypothesisSerializer(serializers.ModelSerializer):
    problem_title = serializers.SerializerMethodField()
    avg_score = serializers.SerializerMethodField()

    class Meta:
        model = Hypothesis
        fields = '__all__'

    def get_problem_title(self, obj):
        return obj.problem.title if obj.problem else ''

    def get_avg_score(self, obj):
        return round((obj.novelty_score + obj.feasibility_score +
                      obj.impact_score + obj.testability_score) / 4, 1)


class FeasibilitySerializer(serializers.ModelSerializer):
    overall_score = serializers.SerializerMethodField()

    class Meta:
        model = Feasibility
        fields = '__all__'

    def get_overall_score(self, obj):
        return round((obj.data_availability + obj.compute_available +
                      obj.time_feasibility + obj.expertise_match) / 4)


class ProposalSerializer(serializers.ModelSerializer):
    completion_pct = serializers.SerializerMethodField()

    class Meta:
        model = Proposal
        fields = '__all__'

    def get_completion_pct(self, obj):
        fields = ['title_abstract', 'introduction', 'lit_review_summary',
                  'problem_statement', 'hypothesis_section', 'methodology',
                  'timeline', 'resources', 'expected_contribution', 'references']
        filled = sum(1 for f in fields if len(getattr(obj, f, '') or '') > 30)
        return round(filled / len(fields) * 100)


class ResearchLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = ResearchLog
        fields = '__all__'


class ThesisChapterSerializer(serializers.ModelSerializer):
    class Meta:
        model = ThesisChapter
        fields = '__all__'


class ProjectSerializer(serializers.ModelSerializer):
    papers_count = serializers.SerializerMethodField()
    problems_count = serializers.SerializerMethodField()
    hypotheses_count = serializers.SerializerMethodField()
    logs_count = serializers.SerializerMethodField()
    has_domain = serializers.SerializerMethodField()

    class Meta:
        model = Project
        fields = '__all__'

    def get_papers_count(self, obj):
        return obj.papers.count()

    def get_problems_count(self, obj):
        return obj.problems.count()

    def get_hypotheses_count(self, obj):
        return obj.hypotheses.count()

    def get_logs_count(self, obj):
        return obj.logs.count()

    def get_has_domain(self, obj):
        return hasattr(obj, 'domain')
