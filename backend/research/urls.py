from django.urls import path
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'projects', views.ProjectViewSet, basename='project')

urlpatterns = router.urls + [
    # Domain
    path('projects/<int:project_pk>/domain/current/', views.DomainViewSet.as_view({'get': 'current', 'post': 'current', 'put': 'current', 'patch': 'current'})),
    # Papers
    path('projects/<int:project_pk>/papers/', views.PaperViewSet.as_view({'get': 'list', 'post': 'create'})),
    path('projects/<int:project_pk>/papers/<int:pk>/', views.PaperViewSet.as_view({'get': 'retrieve', 'put': 'update', 'patch': 'partial_update', 'delete': 'destroy'})),
    # Problems
    path('projects/<int:project_pk>/problems/', views.ProblemViewSet.as_view({'get': 'list', 'post': 'create'})),
    path('projects/<int:project_pk>/problems/<int:pk>/', views.ProblemViewSet.as_view({'get': 'retrieve', 'put': 'update', 'patch': 'partial_update', 'delete': 'destroy'})),
    # Hypotheses
    path('projects/<int:project_pk>/hypotheses/', views.HypothesisViewSet.as_view({'get': 'list', 'post': 'create'})),
    path('projects/<int:project_pk>/hypotheses/<int:pk>/', views.HypothesisViewSet.as_view({'get': 'retrieve', 'put': 'update', 'patch': 'partial_update', 'delete': 'destroy'})),
    path('projects/<int:project_pk>/hypotheses/<int:pk>/select/', views.HypothesisViewSet.as_view({'post': 'select'})),
    path('projects/<int:project_pk>/hypotheses/update_elo/', views.HypothesisViewSet.as_view({'post': 'update_elo'})),
    # Feasibility
    path('projects/<int:project_pk>/feasibility/current/', views.FeasibilityViewSet.as_view({'get': 'current', 'post': 'current', 'put': 'current', 'patch': 'current'})),
    # Proposal
    path('projects/<int:project_pk>/proposal/current/', views.ProposalViewSet.as_view({'get': 'current', 'post': 'current', 'put': 'current', 'patch': 'current'})),
    # Logs
    path('projects/<int:project_pk>/logs/', views.ResearchLogViewSet.as_view({'get': 'list', 'post': 'create'})),
    path('projects/<int:project_pk>/logs/<int:pk>/', views.ResearchLogViewSet.as_view({'get': 'retrieve', 'put': 'update', 'patch': 'partial_update', 'delete': 'destroy'})),
    # Thesis chapters
    path('projects/<int:project_pk>/thesis/', views.ThesisChapterViewSet.as_view({'get': 'list', 'post': 'create'})),
    path('projects/<int:project_pk>/thesis/<int:pk>/', views.ThesisChapterViewSet.as_view({'get': 'retrieve', 'put': 'update', 'patch': 'partial_update', 'delete': 'destroy'})),
    path('projects/<int:project_pk>/thesis/by_key/', views.ThesisChapterViewSet.as_view({'get': 'by_key', 'post': 'by_key', 'put': 'by_key', 'patch': 'by_key'})),
    # Dashboard
    path('projects/<int:pk>/dashboard/', views.ProjectViewSet.as_view({'get': 'dashboard'})),
]

# Paper Readings
urlpatterns += [
    path('projects/<int:project_pk>/paper-readings/', views.PaperReadingViewSet.as_view({'get': 'list', 'post': 'create'})),
    path('projects/<int:project_pk>/paper-readings/<int:pk>/', views.PaperReadingViewSet.as_view({'get': 'retrieve', 'put': 'update', 'patch': 'partial_update', 'delete': 'destroy'})),
    path('projects/<int:project_pk>/paper-readings/<int:pk>/set_problems/', views.PaperReadingViewSet.as_view({'post': 'set_problems'})),
    # Survey Readings
    path('projects/<int:project_pk>/survey-readings/', views.SurveyReadingViewSet.as_view({'get': 'list', 'post': 'create'})),
    path('projects/<int:project_pk>/survey-readings/<int:pk>/', views.SurveyReadingViewSet.as_view({'get': 'retrieve', 'put': 'update', 'patch': 'partial_update', 'delete': 'destroy'})),
    path('projects/<int:project_pk>/survey-readings/<int:pk>/set_problems/', views.SurveyReadingViewSet.as_view({'post': 'set_problems'})),
    # Venue Tracker
    path('projects/<int:project_pk>/venues/', views.VenueTrackerViewSet.as_view({'get': 'list', 'post': 'create'})),
    path('projects/<int:project_pk>/venues/<int:pk>/', views.VenueTrackerViewSet.as_view({'get': 'retrieve', 'put': 'update', 'patch': 'partial_update', 'delete': 'destroy'})),
]
