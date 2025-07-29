

from django.shortcuts import get_object_or_404
from core.models import Project
 
def update_project_timestamp(project_id, user=None):
    try:
        # Get the project
        if user:
            project = get_object_or_404(Project, id=project_id, user=user)
        else:
            project = get_object_or_404(Project, id=project_id)
           
        # Print debug info
        print(f"Updating timestamp for project {project_id} ({project.name})")
        print(f"Old timestamp: {project.updated_at}")
       
        # Just calling save() will update the updated_at field since it uses auto_now=True
        project.save(update_fields=['updated_at'])
       
        # Get the updated timestamp
        project.refresh_from_db()
        print(f"New timestamp: {project.updated_at}")
       
        return True
    except Project.DoesNotExist:
        print(f"Project {project_id} not found")
        return False
    except Exception as e:
        print(f"Error updating project timestamp: {str(e)}")
        return False