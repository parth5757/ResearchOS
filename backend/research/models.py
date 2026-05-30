from django.db import models


class Project(models.Model):
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name


class Domain(models.Model):
    project = models.OneToOneField(Project, on_delete=models.CASCADE, related_name='domain')
    topic = models.CharField(max_length=500)
    subarea = models.CharField(max_length=300, blank=True)
    supervisor = models.CharField(max_length=200, blank=True)
    keywords = models.TextField(blank=True)
    motivation = models.TextField(blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.topic


class Paper(models.Model):
    RELEVANCE_CHOICES = [
        ('high', 'High'),
        ('medium', 'Medium'),
        ('low', 'Low'),
    ]
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='papers')
    title = models.CharField(max_length=600)
    authors = models.CharField(max_length=400, blank=True)
    year = models.CharField(max_length=10, blank=True)
    journal = models.CharField(max_length=300, blank=True)
    doi = models.CharField(max_length=300, blank=True)
    abstract = models.TextField(blank=True)
    key_findings = models.TextField(blank=True)
    gaps = models.TextField(blank=True)
    methods = models.TextField(blank=True)
    my_notes = models.TextField(blank=True)
    relevance = models.CharField(max_length=10, choices=RELEVANCE_CHOICES, default='medium')
    tags = models.CharField(max_length=500, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.title


class Problem(models.Model):
    STATUS_CHOICES = [
        ('unsolved', 'Unsolved'),
        ('partially_solved', 'Partially Solved'),
        ('open', 'Open / Debated'),
        ('solved', 'Already Solved'),
    ]
    DIFFICULTY_CHOICES = [
        ('easy', 'Easy'),
        ('medium', 'Medium'),
        ('hard', 'Hard'),
        ('very_hard', 'Very Hard'),
    ]
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='problems')
    title = models.CharField(max_length=500)
    description = models.TextField(blank=True)
    source_papers = models.CharField(max_length=500, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='unsolved')
    difficulty = models.CharField(max_length=10, choices=DIFFICULTY_CHOICES, default='medium')
    existing_work = models.TextField(blank=True)
    my_approach = models.TextField(blank=True)
    potential_impact = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.title


class Hypothesis(models.Model):
    RANK_CHOICES = [(str(i), str(i)) for i in range(1, 11)]
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='hypotheses')
    problem = models.ForeignKey(Problem, on_delete=models.SET_NULL, null=True, blank=True, related_name='hypotheses')
    statement = models.TextField()
    rationale = models.TextField(blank=True)
    testing_method = models.TextField(blank=True)
    expected_outcome = models.TextField(blank=True)
    # Reflection (critique)
    strengths = models.TextField(blank=True)
    weaknesses = models.TextField(blank=True)
    assumptions = models.TextField(blank=True)
    # Ranking
    novelty_score = models.IntegerField(default=5)
    feasibility_score = models.IntegerField(default=5)
    impact_score = models.IntegerField(default=5)
    testability_score = models.IntegerField(default=5)
    elo_rating = models.IntegerField(default=1200)
    # Evolution
    evolved_version = models.TextField(blank=True)
    evolution_notes = models.TextField(blank=True)
    # Status
    is_selected = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-elo_rating', '-created_at']

    def __str__(self):
        return self.statement[:80]


class Feasibility(models.Model):
    project = models.OneToOneField(Project, on_delete=models.CASCADE, related_name='feasibility')
    data_availability = models.IntegerField(default=50)
    compute_available = models.IntegerField(default=50)
    time_feasibility = models.IntegerField(default=50)
    expertise_match = models.IntegerField(default=50)
    data_sources = models.TextField(blank=True)
    compute_plan = models.TextField(blank=True)
    timeline_plan = models.TextField(blank=True)
    risk_notes = models.TextField(blank=True)
    notes = models.TextField(blank=True)
    is_done = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Feasibility for {self.project.name}"


class Proposal(models.Model):
    project = models.OneToOneField(Project, on_delete=models.CASCADE, related_name='proposal')
    title_abstract = models.TextField(blank=True)
    introduction = models.TextField(blank=True)
    lit_review_summary = models.TextField(blank=True)
    problem_statement = models.TextField(blank=True)
    hypothesis_section = models.TextField(blank=True)
    methodology = models.TextField(blank=True)
    timeline = models.TextField(blank=True)
    resources = models.TextField(blank=True)
    expected_contribution = models.TextField(blank=True)
    references = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Proposal for {self.project.name}"


class ResearchLog(models.Model):
    PHASE_CHOICES = [
        ('literature', 'Literature Review'),
        ('problem_def', 'Problem Definition'),
        ('hypothesis', 'Hypothesis Development'),
        ('execution', 'Research Execution'),
        ('writing', 'Thesis Writing'),
        ('revision', 'Revision'),
    ]
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='logs')
    date = models.DateField()
    phase = models.CharField(max_length=20, choices=PHASE_CHOICES, default='execution')
    hours_worked = models.DecimalField(max_digits=4, decimal_places=1, null=True, blank=True)
    achieved = models.TextField(blank=True)
    remaining = models.TextField(blank=True)
    blockers = models.TextField(blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-date', '-created_at']

    def __str__(self):
        return f"Log {self.date} - {self.phase}"


class ThesisChapter(models.Model):
    CHAPTER_CHOICES = [
        ('abstract', 'Abstract'),
        ('ch1', 'Chapter 1 — Introduction'),
        ('ch2', 'Chapter 2 — Literature Review'),
        ('ch3', 'Chapter 3 — Methodology'),
        ('ch4', 'Chapter 4 — Implementation'),
        ('ch5', 'Chapter 5 — Results & Discussion'),
        ('ch6', 'Chapter 6 — Conclusion'),
        ('refs', 'References'),
        ('appendix', 'Appendix'),
    ]
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='thesis_chapters')
    chapter_key = models.CharField(max_length=20, choices=CHAPTER_CHOICES)
    content = models.TextField(blank=True)
    word_count = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('project', 'chapter_key')

    def save(self, *args, **kwargs):
        self.word_count = len(self.content.split()) if self.content else 0
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.chapter_key} - {self.project.name}"
