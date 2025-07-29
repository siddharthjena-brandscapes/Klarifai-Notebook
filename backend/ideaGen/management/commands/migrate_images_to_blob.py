from django.core.management.base import BaseCommand
from ideaGen.utils import migrate_existing_images_to_blob

class Command(BaseCommand):
    help = 'Migrates existing images from filesystem to Azure Blob Storage'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Starting image migration to Azure Blob Storage...'))
        
        result = migrate_existing_images_to_blob()
        
        if 'error' in result:
            self.stdout.write(self.style.ERROR(f'Migration failed: {result["error"]}'))
        else:
            self.stdout.write(self.style.SUCCESS(
                f'Migration completed. Processed {result["total"]} images: '
                f'{result["migrated"]} migrated, {result["errors"]} errors.'
            ))