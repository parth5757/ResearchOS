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


class PaperReading(models.Model):
    """Track detailed reading notes for a research paper."""
    PAPER_TYPE_CHOICES = [
        ('research', 'Research Paper'),
        ('survey', 'Survey Paper'),
        ('review', 'Review Article'),
        ('conference', 'Conference Paper'),
        ('preprint', 'Preprint / arXiv'),
        ('book_chapter', 'Book Chapter'),
    ]
    READING_STATUS_CHOICES = [
        ('to_read', 'To Read'),
        ('reading', 'Currently Reading'),
        ('done', 'Done'),
        ('revisit', 'Needs Revisit'),
    ]
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='paper_readings')
    # Linked to existing Paper record (optional)
    linked_paper = models.ForeignKey(Paper, on_delete=models.SET_NULL, null=True, blank=True, related_name='readings')
    # Linked to Problem(s) — comma separated IDs stored as text for simplicity
    related_problems = models.ManyToManyField(Problem, blank=True, related_name='paper_readings')

    # Paper info (filled even if no linked_paper)
    title = models.CharField(max_length=600)
    authors = models.CharField(max_length=400, blank=True)
    year = models.CharField(max_length=10, blank=True)
    source = models.CharField(max_length=300, blank=True, help_text='Journal / Conference / arXiv ID')
    paper_type = models.CharField(max_length=20, choices=PAPER_TYPE_CHOICES, default='research')
    url_or_doi = models.CharField(max_length=400, blank=True)

    # Reading status
    status = models.CharField(max_length=10, choices=READING_STATUS_CHOICES, default='to_read')
    date_read = models.DateField(null=True, blank=True)

    # Core annotations
    problem_addressed = models.TextField(blank=True, help_text='Which problem does this paper address?')
    solutions_found = models.TextField(blank=True, help_text='What solutions / methods did the paper propose?')
    key_contributions = models.TextField(blank=True, help_text='Main contributions of the paper')
    datasets_used = models.TextField(blank=True, help_text='Datasets / benchmarks used')
    results_summary = models.TextField(blank=True, help_text='Key results and metrics')
    unsolved_issues = models.TextField(blank=True, help_text='Problems still unsolved / limitations noted')
    future_work = models.TextField(blank=True, help_text='Future work directions mentioned')
    my_critique = models.TextField(blank=True, help_text='Your critical analysis / disagreements')
    how_it_helps_me = models.TextField(blank=True, help_text='How does this paper help your own research?')
    important_references = models.TextField(blank=True, help_text='Other papers cited here that you should read')
    personal_notes = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-date_read', '-created_at']

    def __str__(self):
        return self.title


class SurveyReading(models.Model):
    """Track detailed reading notes specifically for survey / review papers."""
    READING_STATUS_CHOICES = [
        ('to_read', 'To Read'),
        ('reading', 'Currently Reading'),
        ('done', 'Done'),
        ('revisit', 'Needs Revisit'),
    ]
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='survey_readings')
    related_problems = models.ManyToManyField(Problem, blank=True, related_name='survey_readings')

    title = models.CharField(max_length=600)
    authors = models.CharField(max_length=400, blank=True)
    year = models.CharField(max_length=10, blank=True)
    source = models.CharField(max_length=300, blank=True)
    url_or_doi = models.CharField(max_length=400, blank=True)

    status = models.CharField(max_length=10, choices=READING_STATUS_CHOICES, default='to_read')
    date_read = models.DateField(null=True, blank=True)

    # Survey-specific fields
    domain_covered = models.TextField(blank=True, help_text='What domain / sub-field does this survey cover?')
    taxonomy = models.TextField(blank=True, help_text='How does the survey classify / categorise the field?')
    papers_covered_count = models.IntegerField(null=True, blank=True, help_text='Approx. number of papers reviewed')
    time_span_covered = models.CharField(max_length=100, blank=True, help_text='e.g. 2010–2024')
    problem_landscape = models.TextField(blank=True, help_text='What problems exist in this field according to the survey?')
    existing_solutions = models.TextField(blank=True, help_text='What solutions / approaches exist?')
    open_challenges = models.TextField(blank=True, help_text='Open challenges and research gaps identified')
    future_directions = models.TextField(blank=True, help_text='Future research directions mentioned')
    benchmark_datasets = models.TextField(blank=True, help_text='Standard datasets / benchmarks in this field')
    key_papers_to_read = models.TextField(blank=True, help_text='Individual papers cited that you must read')
    relevance_to_my_work = models.TextField(blank=True, help_text='How does this survey relate to your research?')
    personal_notes = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-date_read', '-created_at']

    def __str__(self):
        return self.title


class VenueTracker(models.Model):
    """Track target publication venues: journals, conferences, workshops."""
    VENUE_TYPE_CHOICES = [
        ('journal', 'Journal'),
        ('conference', 'Conference'),
        ('workshop', 'Workshop'),
        ('symposium', 'Symposium'),
        ('arxiv', 'arXiv / Preprint'),
    ]
    SUBMISSION_STATUS_CHOICES = [
        ('target', 'Target (Not Submitted)'),
        ('preparing', 'Preparing Submission'),
        ('submitted', 'Submitted'),
        ('under_review', 'Under Review'),
        ('accepted', 'Accepted'),
        ('rejected', 'Rejected'),
        ('withdrawn', 'Withdrawn'),
    ]
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='venues')
    name = models.CharField(max_length=400)
    abbreviation = models.CharField(max_length=100, blank=True, help_text='e.g. NeurIPS, IEEE TPAMI')
    venue_type = models.CharField(max_length=15, choices=VENUE_TYPE_CHOICES, default='journal')
    url = models.CharField(max_length=400, blank=True)

    # Publication details
    publisher = models.CharField(max_length=200, blank=True)
    issn_isbn = models.CharField(max_length=100, blank=True)
    impact_factor = models.CharField(max_length=50, blank=True)
    h_index = models.CharField(max_length=50, blank=True)
    quartile = models.CharField(max_length=20, blank=True, help_text='e.g. Q1, Q2, SCI, Scopus')
    acceptance_rate = models.CharField(max_length=50, blank=True, help_text='e.g. ~25%')

    # Scope & fit
    scope = models.TextField(blank=True, help_text='Topics / scope of this venue')
    why_suitable = models.TextField(blank=True, help_text='Why is this venue suitable for your work?')
    page_limit = models.CharField(max_length=100, blank=True)
    submission_format = models.CharField(max_length=200, blank=True, help_text='e.g. LaTeX, IEEE template')

    # Deadlines & dates (for conferences)
    submission_deadline = models.DateField(null=True, blank=True)
    notification_date = models.DateField(null=True, blank=True)
    camera_ready_date = models.DateField(null=True, blank=True)
    event_date = models.CharField(max_length=100, blank=True, help_text='Conference/event date or month')

    # Tracking
    status = models.CharField(max_length=15, choices=SUBMISSION_STATUS_CHOICES, default='target')
    submission_date = models.DateField(null=True, blank=True)
    paper_id_received = models.CharField(max_length=200, blank=True, help_text='Paper ID / submission ID')
    review_notes = models.TextField(blank=True, help_text='Reviewer feedback / notes')
    notes = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.name


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
