# # routers.py (create this file in your project directory)

# class DatabaseRouter:
#     """
#     Router to handle multiple database routing
#     """
#     def db_for_read(self, model, **hints):
#         """
#         Route read operations to appropriate database
#         """
#         if model._meta.app_label == 'structruedDataQuery':
#             return 'data_analysis'
#         return 'default'

#     def db_for_write(self, model, **hints):
#         """
#         Route write operations to appropriate database
#         """
#         if model._meta.app_label == 'structruedDataQuery':
#             return 'data_analysis'
#         return 'default'

#     def allow_relation(self, obj1, obj2, **hints):
#         """
#         Allow relations between objects in the same database
#         """
#         if obj1._meta.app_label == obj2._meta.app_label:
#             return True
#         return None

#     def allow_migrate(self, db, app_label, model_name=None, **hints):
#         """
#         Control which apps can migrate in which database
#         """
#         if app_label == 'structruedDataQuery':
#             return db == 'data_analysis'
#         return db == 'default'