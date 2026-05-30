from django.contrib import admin
from .models import (Project, Domain, Paper, Problem, Hypothesis,
                     Feasibility, Proposal, ResearchLog, ThesisChapter)

admin.site.register(Project)
admin.site.register(Domain)
admin.site.register(Paper)
admin.site.register(Problem)
admin.site.register(Hypothesis)
admin.site.register(Feasibility)
admin.site.register(Proposal)
admin.site.register(ResearchLog)
admin.site.register(ThesisChapter)
