
        
# views.py
from django.shortcuts import render, get_object_or_404
from django.http import JsonResponse,HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
import json
from .models import ProductIdea2, GeneratedImage2, Idea
import google.generativeai as genai
from huggingface_hub import InferenceClient
from PIL import Image
from collections import defaultdict
import time
import random
import io
import base64
from django.core.files.base import ContentFile
from datetime import datetime
from django.db.models import Max, Q
import os, re
from django.conf import settings
from rest_framework.authentication import TokenAuthentication
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from chat.models import UserAPITokens


# HF_API_TOKEN = "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"
 

# hf_client = InferenceClient(
#     model="black-forest-labs/FLUX.1-schnell",
#     token=HF_API_TOKEN
# )
 
 
def generate_prompt_text(dynamic_fields):
    """Convert dynamic fields into a readable paragraph format"""
    grouped_fields = defaultdict(list)
    for field in dynamic_fields.values():
        if field.get('active'):
            field_type = field.get('type', 'Unknown')
            value = field.get('value', '')
            if value:  # Only add non-empty values
                grouped_fields[field_type].append(value)
   
    # Create a sentence for each category using a generic template
    sentences = []
    for field_type, values in grouped_fields.items():
        # Adjust the sentence structure as needed; here's a generic version:
        sentence = f"For {field_type}, the following aspects are noted: {', '.join(values)}."
        sentences.append(sentence)
   
    # Combine all sentences into a single paragraph
    return " ".join(sentences)
 

@api_view(['POST', 'GET', 'DELETE'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def generate_ideas(request):
     
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            print("Received data:", json.dumps(data, indent=2))
            
            # Extract and validate project
            project_id = data.get('project_id')
            if not project_id:
                raise ValueError("project_id is required")
            
            # Get the project instance
            try:
                project = Project.objects.get(id=project_id, user=request.user)
            except Project.DoesNotExist:
                raise ValueError(f"Project with id {project_id} does not exist")

            # Get current set number
            max_set_number = Idea.objects.filter(
                product_idea__project_id=project_id
            ).aggregate(Max('idea_set'))['idea_set__max'] or 0
            current_set = max_set_number + 1
            
            # Extract other fields
            product = data.get('product')
            brand = data.get('brand')
            category = data.get('category')
            number_of_ideas = int(data.get('number_of_ideas', 1))
            description_length = int(data.get('description_length', 70))  # New field with default value of 70
            dynamic_fields = data.get('dynamicFields', {})
            negative_prompt = data.get('negative_prompt', '')

            # Generate formatted prompt text
            formatted_dynamic_fields = generate_prompt_text(dynamic_fields)
            
            # Create ProductIdea2 instance
            product_idea = ProductIdea2.objects.create(
                user=request.user,
                project=project,
                product=product,
                brand=brand,
                category=category,
                number_of_ideas=number_of_ideas,
                description_length=description_length,  # New field
                dynamic_fields=dynamic_fields,
                negative_prompt=negative_prompt
            )
            user_tokens = UserAPITokens.objects.get(user=request.user)
            GOOGLE_API_KEY = user_tokens.gemini_token 
           # hf_api_token = user_tokens.huggingface_token 
            
            # Initialize APIs
            genai.configure(api_key=GOOGLE_API_KEY)
            model = genai.GenerativeModel('gemini-1.5-flash')            
            # Generate ideas using modified prompt logic to include brand name and description length
            ideas_prompt = (
                f"Generate {number_of_ideas} unique and creative product ideas for product named {product} from the brand {brand} with category {category}.\n"
                "While crafting these ideas, consider the following dynamic attributes as contextual guidelines. Use these inputs to shape the tone, style, and features of each idea so that they naturally resonate with the intended audience, without explicitly mentioning the attribute values.\n"
                f"Dynamic Attributes: {formatted_dynamic_fields}\n"
                f"IMPORTANT CONSTRAINTS: Avoid generating ideas that involve the following terms or concepts: {negative_prompt}\n"
                "If any generated idea contains or relates to these terms, immediately discard that idea and generate a completely different one.\n"
                f"CRITICAL REQUIREMENT: ALWAYS include the brand name '{brand}' at the beginning of each product name.\n"
                "Format each idea as a clean, valid JSON object with 'product_name' and 'description' fields, like this example:\n"
                f"{{  \"product_name\": \"{brand} Example Name\",\n  \"description\": \"Example description\"\n}}\n"
                "The 'description' should be clear, engaging, and written in simple language that highlights the product's key features and unique selling points. "
                "Ensure that the description explains how the product benefits the user and what makes it special, making it easy to visualize the idea, while seamlessly integrating the contextual cues from the dynamic attributes.\n"
                "Aim for a variety of ideas such that each is unique and creative, and focuses on different aspects of the product.\n"
                f"For each idea, provide a detailed explanation with exactly {description_length} words in the description."
            )

            print("Generated prompt:", ideas_prompt)
            
            response = model.generate_content(
                ideas_prompt,
                generation_config={
                    'temperature': 1.0,
                    # 'max_output_tokens': 4000
                }
            )

            print("Generated Ideas Response:", response.text)
            
            # Process generated ideas
            validated_ideas = []
            try:
                # Split the response into individual JSON objects
                json_objects = response.text.split('```json')
                cleaned_jsons = []
                
                for obj in json_objects:
                    if obj.strip():
                        # Remove backticks and clean the JSON string
                        cleaned = obj.strip().strip('`').strip()
                        if cleaned:
                            cleaned_jsons.append(cleaned)

                print("Cleaned JSON objects:", cleaned_jsons)
                
                for index, json_text in enumerate(cleaned_jsons):
                    try:
                        idea_data = json.loads(json_text)
                        print(f"Processing idea {index + 1}:", idea_data)
                        
                        if isinstance(idea_data, dict) and 'product_name' in idea_data and 'description' in idea_data:
                            # Ensure brand name is in product name
                            if not idea_data['product_name'].startswith(brand):
                                idea_data['product_name'] = f"{brand} {idea_data['product_name']}"
                            
                            # Decompose and synthesize the idea
                            aspects = decompose_product_description(idea_data, model)
                            enhanced_description = synthesize_product_aspects(idea_data, aspects, model)
                            
                            # Generate visualization prompt
                            visualization_prompt = enhance_prompt(enhanced_description, model)
                            
                            # Create idea instance
                            idea_set_label = f"Set {current_set}-{index + 1}"
                            idea = Idea.objects.create(
                                product_idea=product_idea,
                                product_name=idea_data['product_name'],
                                description=idea_data['description'],
                                decomposed_aspects=aspects,
                                enhanced_description=enhanced_description,
                                visualization_prompt=visualization_prompt,
                                idea_set=current_set,
                                idea_set_label=idea_set_label
                            )
                            
                            validated_ideas.append({
                                'idea_id': idea.id,
                                'product_name': idea.product_name,
                                'description': idea.description,
                                'decomposed_aspects': aspects,
                                'enhanced_description': enhanced_description,
                                'visualization_prompt': visualization_prompt,
                                'idea_set': current_set,
                                'idea_set_label': idea_set_label
                            })
                            print(f"Successfully processed idea {index + 1}")
                    except json.JSONDecodeError as e:
                        print(f"Error parsing JSON for idea {index + 1}:", str(e))
                        try:
                            # Remove any trailing characters after the closing brace
                            cleaned_json = json_text.split('}')[0] + '}'
                            idea_data = json.loads(cleaned_json)
                            
                            # Ensure brand name is in product name
                            if not idea_data['product_name'].startswith(brand):
                                idea_data['product_name'] = f"{brand} {idea_data['product_name']}"
                                
                            # Process the idea same as above
                            aspects = decompose_product_description(idea_data, model)
                            enhanced_description = synthesize_product_aspects(idea_data, aspects, model)
                            visualization_prompt = enhance_prompt(enhanced_description, model)
                            
                            idea_set_label = f"Set {current_set}-{index + 1}"
                            idea = Idea.objects.create(
                                product_idea=product_idea,
                                product_name=idea_data['product_name'],
                                description=idea_data['description'],
                                decomposed_aspects=aspects,
                                enhanced_description=enhanced_description,
                                visualization_prompt=visualization_prompt,
                                idea_set=current_set,
                                idea_set_label=idea_set_label
                            )
                            
                            validated_ideas.append({
                                'idea_id': idea.id,
                                'product_name': idea.product_name,
                                'description': idea.description,
                                'decomposed_aspects': aspects,
                                'enhanced_description': enhanced_description,
                                'visualization_prompt': visualization_prompt,
                                'idea_set': current_set,
                                'idea_set_label': idea_set_label
                            })
                            print(f"Successfully processed idea {index + 1} after cleaning")
                        except Exception as e2:
                            print(f"Failed to process idea {index + 1} even after cleaning:", str(e2))
                            continue
                    except Exception as e:
                        print(f"Unexpected error processing idea {index + 1}:", str(e))
                        continue
                
                # If no ideas were processed through JSON parsing, try text parsing
                if not validated_ideas:
                    print("No ideas processed from JSON, falling back to text parsing")
                    lines = response.text.split('\n')
                    current_name = None
                    current_description = []
                    
                    for line in lines:
                        if ' - ' in line:
                            # Process previous idea if exists
                            if current_name and current_description:
                                description_text = ' '.join(current_description)
                                
                                # Ensure brand name is in product name
                                if not current_name.startswith(brand):
                                    current_name = f"{brand} {current_name}"
                                
                                idea_data = {
                                    'product_name': current_name,
                                    'description': description_text
                                }
                                
                                aspects = decompose_product_description(idea_data, model)
                                enhanced_description = synthesize_product_aspects(idea_data, aspects, model)
                                visualization_prompt = enhance_prompt(enhanced_description, model)
                                
                                idea_set_label = f"Set {current_set}-{len(validated_ideas) + 1}"
                                idea = Idea.objects.create(
                                    product_idea=product_idea,
                                    product_name=current_name,
                                    description=description_text,
                                    decomposed_aspects=aspects,
                                    enhanced_description=enhanced_description,
                                    visualization_prompt=visualization_prompt,
                                    idea_set=current_set,
                                    idea_set_label=idea_set_label
                                )
                                
                                validated_ideas.append({
                                    'idea_id': idea.id,
                                    'product_name': idea.product_name,
                                    'description': idea.description,
                                    'decomposed_aspects': aspects,
                                    'enhanced_description': enhanced_description,
                                    'visualization_prompt': visualization_prompt,
                                    'idea_set': current_set,
                                    'idea_set_label': idea_set_label
                                })
                            
                            # Start new idea
                            name_part, desc_part = line.split(' - ', 1)
                            current_name = name_part.strip()
                            current_description = [desc_part.strip()]
                        elif line.strip() and current_name:
                            current_description.append(line.strip())
                    
                    # Process the last idea if exists
                    if current_name and current_description:
                        description_text = ' '.join(current_description)
                        
                        # Ensure brand name is in product name
                        if not current_name.startswith(brand):
                            current_name = f"{brand} {current_name}"
                            
                        idea_data = {
                            'product_name': current_name,
                            'description': description_text
                        }
                        
                        aspects = decompose_product_description(idea_data, model)
                        enhanced_description = synthesize_product_aspects(idea_data, aspects, model)
                        visualization_prompt = enhance_prompt(enhanced_description, model)
                        
                        idea_set_label = f"Set {current_set}-{len(validated_ideas) + 1}"
                        idea = Idea.objects.create(
                            product_idea=product_idea,
                            product_name=current_name,
                            description=description_text,
                            decomposed_aspects=aspects,
                            enhanced_description=enhanced_description,
                            visualization_prompt=visualization_prompt,
                            idea_set=current_set,
                            idea_set_label=idea_set_label
                        )
                        
                        validated_ideas.append({
                            'idea_id': idea.id,
                            'product_name': idea.product_name,
                            'description': idea.description,
                            'decomposed_aspects': aspects,
                            'enhanced_description': enhanced_description,
                            'visualization_prompt': visualization_prompt,
                            'idea_set': current_set,
                            'idea_set_label': idea_set_label
                        })

            except Exception as e:
                print(f"Error in idea processing: {str(e)}")
                raise

            print("Final validated ideas:", json.dumps(validated_ideas, indent=2))
            
            response_data = {
                "success": True,
                "ideas": validated_ideas,
                "stored_data": {
                    "product_idea_id": product_idea.id,
                    "project_id": project.id,
                    "project_name": project.name,
                    "product": product_idea.product,
                    "brand": product_idea.brand,
                    "category": product_idea.category,
                    "dynamic_fields": product_idea.dynamic_fields,
                    "current_set": current_set,
                    "negative_prompt": negative_prompt
                }
            }

            print("Sending response:", json.dumps(response_data, indent=2))
            
            
            return JsonResponse(response_data)
            
        except Exception as e:
            print("Error:", str(e))
            return JsonResponse({
                "success": False,
                "error": str(e)
            }, status=500)

# @api_view(['POST', 'GET', 'DELETE'])
# @authentication_classes([TokenAuthentication])
# @permission_classes([IsAuthenticated])
# def generate_ideas(request):
     
#     if request.method == 'POST':
#         try:
#             data = json.loads(request.body)
#             print("Received data:", json.dumps(data, indent=2))
            
#             # Extract and validate project
#             project_id = data.get('project_id')
#             if not project_id:
#                 raise ValueError("project_id is required")
            
#             # Get the project instance
#             try:
#                 project = Project.objects.get(id=project_id, user=request.user)
#             except Project.DoesNotExist:
#                 raise ValueError(f"Project with id {project_id} does not exist")

#             # Get current set number
#             max_set_number = Idea.objects.filter(
#                 product_idea__project_id=project_id
#             ).aggregate(Max('idea_set'))['idea_set__max'] or 0
#             current_set = max_set_number + 1
            
#             # Extract other fields
#             product = data.get('product')
#             brand = data.get('brand')
#             category = data.get('category')
#             number_of_ideas = int(data.get('number_of_ideas', 1))
#             dynamic_fields = data.get('dynamicFields', {})
#             negative_prompt = data.get('negative_prompt', '')

#             # Generate formatted prompt text
#             formatted_dynamic_fields = generate_prompt_text(dynamic_fields)
            
#             # Create ProductIdea2 instance
#             product_idea = ProductIdea2.objects.create(
#                 user=request.user,
#                 project=project,
#                 product=product,
#                 brand=brand,
#                 category=category,
#                 number_of_ideas=number_of_ideas,
#                 dynamic_fields=dynamic_fields,
#                 negative_prompt=negative_prompt

#             )
#             user_tokens = UserAPITokens.objects.get(user=request.user)
#             GOOGLE_API_KEY = user_tokens.gemini_token 
#            # hf_api_token = user_tokens.huggingface_token 
            
#             # Initialize APIs
#             genai.configure(api_key=GOOGLE_API_KEY)
#             model = genai.GenerativeModel('gemini-1.5-flash')            
#             # Generate ideas using existing prompt logic
#             ideas_prompt = (
#                 f"Generate {number_of_ideas} unique and creative product ideas for product named {product} under the brand {brand} with category {category}.\n"
#                 "While crafting these ideas, consider the following dynamic attributes as contextual guidelines. Use these inputs to shape the tone, style, and features of each idea so that they naturally resonate with the intended audience, without explicitly mentioning the attribute values.\n"
#                 f"Dynamic Attributes: {formatted_dynamic_fields}\n"
#                 f"IMPORTANT CONSTRAINTS: Avoid generating ideas that involve the following terms or concepts: {negative_prompt}\n"
#                 "If any generated idea contains or relates to these terms, immediately discard that idea and generate a completely different one.\n"
#                 "Format each idea as a clean, valid JSON object with 'product_name' and 'description' fields, like this example:\n"
#                 "{\n  \"product_name\": \"Example Name\",\n  \"description\": \"Example description\"\n}\n"
#                 "The 'description' should be clear, engaging, and written in simple language that highlights the product's key features and unique selling points. "
#                 "Ensure that the description explains how the product benefits the user and what makes it special, making it easy to visualize the idea, while seamlessly integrating the contextual cues from the dynamic attributes.\n"
#                 "Aim for a variety of ideas such that each is unique and creative, and focuses on different aspects of the product.\n"
#                 "For each idea, provide a detailed explanation with at most 75 words in the description."
#             )

#             print("Generated prompt:", ideas_prompt)
            
#             response = model.generate_content(
#                 ideas_prompt,
#                 generation_config={
#                     'temperature': 1.0,
#                     # 'max_output_tokens': 4000
#                 }
#             )

#             print("Generated Ideas Response:", response.text)
            
#             # Process generated ideas
#             validated_ideas = []
#             try:
#                 # Split the response into individual JSON objects
#                 json_objects = response.text.split('```json')
#                 cleaned_jsons = []
                
#                 for obj in json_objects:
#                     if obj.strip():
#                         # Remove backticks and clean the JSON string
#                         cleaned = obj.strip().strip('`').strip()
#                         if cleaned:
#                             cleaned_jsons.append(cleaned)

#                 print("Cleaned JSON objects:", cleaned_jsons)
                
#                 for index, json_text in enumerate(cleaned_jsons):
#                     try:
#                         idea_data = json.loads(json_text)
#                         print(f"Processing idea {index + 1}:", idea_data)
                        
#                         if isinstance(idea_data, dict) and 'product_name' in idea_data and 'description' in idea_data:
#                             # Decompose and synthesize the idea
#                             aspects = decompose_product_description(idea_data, model)
#                             enhanced_description = synthesize_product_aspects(idea_data, aspects, model)
                            
#                             # Generate visualization prompt
#                             visualization_prompt = enhance_prompt(enhanced_description, model)
                            
#                             # Create idea instance
#                             idea_set_label = f"Set {current_set}-{index + 1}"
#                             idea = Idea.objects.create(
#                                 product_idea=product_idea,
#                                 product_name=idea_data['product_name'],
#                                 description=idea_data['description'],
#                                 decomposed_aspects=aspects,
#                                 enhanced_description=enhanced_description,
#                                 visualization_prompt=visualization_prompt,
#                                 idea_set=current_set,
#                                 idea_set_label=idea_set_label
#                             )
                            
#                             validated_ideas.append({
#                                 'idea_id': idea.id,
#                                 'product_name': idea.product_name,
#                                 'description': idea.description,
#                                 'decomposed_aspects': aspects,
#                                 'enhanced_description': enhanced_description,
#                                 'visualization_prompt': visualization_prompt,
#                                 'idea_set': current_set,
#                                 'idea_set_label': idea_set_label
#                             })
#                             print(f"Successfully processed idea {index + 1}")
#                     except json.JSONDecodeError as e:
#                         print(f"Error parsing JSON for idea {index + 1}:", str(e))
#                         try:
#                             # Remove any trailing characters after the closing brace
#                             cleaned_json = json_text.split('}')[0] + '}'
#                             idea_data = json.loads(cleaned_json)
#                             # Process the idea same as above
#                             aspects = decompose_product_description(idea_data, model)
#                             enhanced_description = synthesize_product_aspects(idea_data, aspects, model)
#                             visualization_prompt = enhance_prompt(enhanced_description, model)
                            
#                             idea_set_label = f"Set {current_set}-{index + 1}"
#                             idea = Idea.objects.create(
#                                 product_idea=product_idea,
#                                 product_name=idea_data['product_name'],
#                                 description=idea_data['description'],
#                                 decomposed_aspects=aspects,
#                                 enhanced_description=enhanced_description,
#                                 visualization_prompt=visualization_prompt,
#                                 idea_set=current_set,
#                                 idea_set_label=idea_set_label
#                             )
                            
#                             validated_ideas.append({
#                                 'idea_id': idea.id,
#                                 'product_name': idea.product_name,
#                                 'description': idea.description,
#                                 'decomposed_aspects': aspects,
#                                 'enhanced_description': enhanced_description,
#                                 'visualization_prompt': visualization_prompt,
#                                 'idea_set': current_set,
#                                 'idea_set_label': idea_set_label
#                             })
#                             print(f"Successfully processed idea {index + 1} after cleaning")
#                         except Exception as e2:
#                             print(f"Failed to process idea {index + 1} even after cleaning:", str(e2))
#                             continue
#                     except Exception as e:
#                         print(f"Unexpected error processing idea {index + 1}:", str(e))
#                         continue
                
#                 # If no ideas were processed through JSON parsing, try text parsing
#                 if not validated_ideas:
#                     print("No ideas processed from JSON, falling back to text parsing")
#                     lines = response.text.split('\n')
#                     current_name = None
#                     current_description = []
                    
#                     for line in lines:
#                         if ' - ' in line:
#                             # Process previous idea if exists
#                             if current_name and current_description:
#                                 description_text = ' '.join(current_description)
                                
#                                 idea_data = {
#                                     'product_name': current_name,
#                                     'description': description_text
#                                 }
                                
#                                 aspects = decompose_product_description(idea_data, model)
#                                 enhanced_description = synthesize_product_aspects(idea_data, aspects, model)
#                                 visualization_prompt = enhance_prompt(enhanced_description, model)
                                
#                                 idea_set_label = f"Set {current_set}-{len(validated_ideas) + 1}"
#                                 idea = Idea.objects.create(
#                                     product_idea=product_idea,
#                                     product_name=current_name,
#                                     description=description_text,
#                                     decomposed_aspects=aspects,
#                                     enhanced_description=enhanced_description,
#                                     visualization_prompt=visualization_prompt,
#                                     idea_set=current_set,
#                                     idea_set_label=idea_set_label
#                                 )
                                
#                                 validated_ideas.append({
#                                     'idea_id': idea.id,
#                                     'product_name': idea.product_name,
#                                     'description': idea.description,
#                                     'decomposed_aspects': aspects,
#                                     'enhanced_description': enhanced_description,
#                                     'visualization_prompt': visualization_prompt,
#                                     'idea_set': current_set,
#                                     'idea_set_label': idea_set_label
#                                 })
                            
#                             # Start new idea
#                             name_part, desc_part = line.split(' - ', 1)
#                             current_name = name_part.strip()
#                             current_description = [desc_part.strip()]
#                         elif line.strip() and current_name:
#                             current_description.append(line.strip())
                    
#                     # Process the last idea if exists
#                     if current_name and current_description:
#                         description_text = ' '.join(current_description)
#                         idea_data = {
#                             'product_name': current_name,
#                             'description': description_text
#                         }
                        
#                         aspects = decompose_product_description(idea_data, model)
#                         enhanced_description = synthesize_product_aspects(idea_data, aspects, model)
#                         visualization_prompt = enhance_prompt(enhanced_description, model)
                        
#                         idea_set_label = f"Set {current_set}-{len(validated_ideas) + 1}"
#                         idea = Idea.objects.create(
#                             product_idea=product_idea,
#                             product_name=current_name,
#                             description=description_text,
#                             decomposed_aspects=aspects,
#                             enhanced_description=enhanced_description,
#                             visualization_prompt=visualization_prompt,
#                             idea_set=current_set,
#                             idea_set_label=idea_set_label
#                         )
                        
#                         validated_ideas.append({
#                             'idea_id': idea.id,
#                             'product_name': idea.product_name,
#                             'description': idea.description,
#                             'decomposed_aspects': aspects,
#                             'enhanced_description': enhanced_description,
#                             'visualization_prompt': visualization_prompt,
#                             'idea_set': current_set,
#                             'idea_set_label': idea_set_label
#                         })

#             except Exception as e:
#                 print(f"Error in idea processing: {str(e)}")
#                 raise

#             print("Final validated ideas:", json.dumps(validated_ideas, indent=2))
            
#             response_data = {
#                 "success": True,
#                 "ideas": validated_ideas,
#                 "stored_data": {
#                     "product_idea_id": product_idea.id,
#                     "project_id": project.id,
#                     "project_name": project.name,
#                     "product": product_idea.product,
#                     "brand": product_idea.brand,
#                     "category": product_idea.category,
#                     "dynamic_fields": product_idea.dynamic_fields,
#                     "current_set": current_set,
#                     "negative_prompt": negative_prompt
#                 }
#             }

#             print("Sending response:", json.dumps(response_data, indent=2))
            
            
#             return JsonResponse(response_data)
            
#         except Exception as e:
#             print("Error:", str(e))
#             return JsonResponse({
#                 "success": False,
#                 "error": str(e)
#             }, status=500)

@api_view(['POST', 'GET', 'DELETE', 'PUT'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def update_idea(request):
  

    if request.method == 'PUT':
        try:
            data = json.loads(request.body)
            idea_id = data.get('idea_id')
            
            # Get the original idea
            original_idea = get_object_or_404(Idea, id=idea_id)

            # Get the original idea
            original_idea = get_object_or_404(Idea, id=idea_id)
            
            # Generate new visualization prompt for updated content
            idea_data = {
                'product_name': data.get('product_name', original_idea.product_name),
                'description': data.get('description', original_idea.description)
            }

            user_tokens = UserAPITokens.objects.get(user=request.user)
            GOOGLE_API_KEY = user_tokens.gemini_token 
           
            
            # Initialize APIs
            genai.configure(api_key=GOOGLE_API_KEY)
            model = genai.GenerativeModel('gemini-1.5-flash') 
            
            # Only regenerate visualization prompt if content changed
            if (idea_data['product_name'] != original_idea.product_name or 
                idea_data['description'] != original_idea.description):
                aspects = decompose_product_description(idea_data, model)
                enhanced_description = synthesize_product_aspects(idea_data, aspects, model)
                visualization_prompt = enhance_prompt(enhanced_description, model)
            else:
                visualization_prompt = original_idea.visualization_prompt
            
            # Create a new version instead of updating the existing one
            new_idea = Idea.objects.create(
                product_idea=original_idea.product_idea,
                product_name=data.get('product_name', original_idea.product_name),
                description=data.get('description', original_idea.description),
                visualization_prompt=visualization_prompt,
                original_idea_id=original_idea.id
            )

            response = JsonResponse({
                "success": True,
                "message": "New idea version created successfully",
                "updated_data": {
                    "idea_id": new_idea.id,
                    "product_name": new_idea.product_name,
                    "description": new_idea.description,
                    "visualization_prompt": visualization_prompt
                }
            })
            
            return response
            
        except Exception as e:
            response = JsonResponse({
                "success": False,
                "error": str(e)
            })
            
            return response
            
           
            

@api_view(['POST', 'GET', 'DELETE'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def delete_idea(request):
   
    if request.method == 'DELETE':
        try:
            data = json.loads(request.body)
            idea_id = data.get('idea_id')
            
            # Get and delete the idea (this will also delete related images due to CASCADE)
            idea = get_object_or_404(Idea, id=idea_id)
            idea.delete()
            
            return JsonResponse({
                "success": True,
                "message": "Idea deleted successfully"
            })
            
        except Exception as e:
            return JsonResponse({
                "success": False,
                "error": str(e)
            }) 
        
def decompose_product_description(idea_data, model):
    """Break down each generated idea into specific visual elements"""
    prompt = f"""
    You are an expert product designer and professional product photographer.
    Carefully analyze the following product idea and decompose it into distinct visual elements that must be captured in a single image or scene.

    Product Name: {idea_data['product_name']}
    Product Description: {idea_data['description']}

    Instructions:
    1. Identify each visual component necessary for a comprehensive representation of the product.
    2. For every component, provide a one line description focusing on:
       - Physical attributes (shape, Dimensions, size, colors)
       - Materials and textures
       - Key features and functionality
       - Style and aesthetic elements
       - Target market positioning (if relevant)
       - Specific brand elements (if relevant)
       - Product positioning (if relevant)
       - Specific product elements (if relevant)
       - Specific product features (if relevant)
       - Product catalog positioning (if relevant)
       - Potential usage scenarios or environments, including relevant occasions or target audiences, lighting, temperature, humidity, and other factors (if applicable)

    3. Include both technical and aesthetic aspects
 
    Important: Format your response as a simple list with one aspect per line, starting each line with a hyphen (-).
    """
   
    try:
        response = model.generate_content(prompt)
        response_text = response.text.strip()
        
        aspects = [
            line[1:].strip()
            for line in response_text.split('\n')
            if line.strip().startswith('-')
        ]
        
        return aspects if aspects else []
           
    except Exception as e:
        print(f"Error decomposing product description: {str(e)}")
        return []
   
def synthesize_product_aspects(idea_data, aspects, model):
    """Synthesize decomposed aspects into an enhanced visualization description"""
    try:
        synthesis_prompt = f"""
        You are a seasoned product photographer and creative director. Create a cohesive product visualization description for an image that showcases both the product and its context.

        Product Name: {idea_data['product_name']}
        Original Description: {idea_data['description']}
        
        Detailed Aspects:
        {json.dumps(aspects, indent=2)}
        
        Requirements:
        1. Seamlessly integrate all identified aspects into one holistic description.
        2. Emphasize key visual details, composition (angles, focus points, etc.), and environmental or contextual elements.
        3. Adhere to professional product photography standards (lighting, background, clarity, brand consistency).
        4. Note any crucial details (such as scale, brand elements, or unique design features).
        5. Make the description concise yet detailed enough for image generation.
        6. Highlight usage occasions, relevant backdrops, or user demographics if it strengthens the overall scene and visual appeal.

        Deliverable:
        - Return only the final enhanced description suitable for an image-generation prompt.
        - Do not include any formatting other than plain text paragraphs.
        - Avoid restating the bullet points verbatim; instead, synthesize them into a fluid, descriptive narrative."""
        
        response = model.generate_content(synthesis_prompt)

        print("Synthesized description: ")
        print(response.text)                # Print the synthesized description

        return response.text.strip()
    except Exception as e:
        print(f"Error in synthesis: {str(e)}")
        return idea_data['description']

    
def enhance_prompt(enhanced_description, model):
    """
    Generate an enhanced product description prompt for image generation.
    Takes the synthesized description and adds specific styling and composition elements.
    """
   
    # Base prompt with stronger emphasis on composition and detail
    base_prompt = f"""Ultra-detailed professional product photography or scene of {enhanced_description}.
    - include relevant usage environment or setting if it enhances the product story
    - if appropriate, depict target audience or typical usage occasions
    - balanced composition with all elements clearly visible
    - professional lighting setup with three-point lighting or suitable alternative for clarity and balanced illumination
    - photorealistic, high-resolution quality
    - perfectly clear and legible text or branding elements
    - commercial advertising style
    - emphasis on both product details and contextual elements
    - clean, polished, and visualy striking presentation
    - professional marketing photo with balanced composition"""
   
     # Analyze description for specific product categories and add relevant styling
    description_lower = enhanced_description.lower()
   
    # Technology and gadgets
    if any(word in description_lower for word in ['tech', 'gadget', 'electronic', 'digital', 'smart', 'device']):
        base_prompt += """, modern tech aesthetic, blue-tinted studio lighting,
        clean minimalist style, glossy finish on surfaces, subtle reflections,
        power indicators and displays clearly visible, interface elements sharp and legible,
        precise edge definition"""
   
    # Natural and eco-friendly products
    if any(word in description_lower for word in ['eco', 'natural', 'organic', 'sustainable', 'bamboo', 'wood']):
        base_prompt += """, natural material textures clearly visible,
        warm lighting to highlight organic materials, matte finish,
        environmental styling, earth tones, texture detail preserved,
        sustainable packaging visible, natural color accuracy"""
   
    # Luxury items
    if any(word in description_lower for word in ['luxury', 'premium', 'high-end', 'elegant', 'exclusive']):
        base_prompt += """, luxury product photography style, dramatic lighting,
        premium finish with metallic accents, sophisticated composition,
        attention to material quality, subtle shadows, elegant presentation,
        premium brand aesthetic, high-end commercial look"""
   
    # Fashion and accessories
    if any(word in description_lower for word in ['fashion', 'clothing', 'wear', 'accessory', 'jewelry', 'watch']):
        base_prompt += """, fashion magazine style, fabric textures clearly visible,
        detailed stitching, material draping, accessories prominently displayed,
        fashion lighting setup, premium fabric detail capture,
        clear view of patterns and textures, product fit visualization"""
 
    # Food & Beverage
    if any(word in description_lower for word in ['food', 'beverage', 'drink', 'edible', 'snack', 'meal']):
        base_prompt += """, mouth-watering presentation, vibrant colors to highlight freshness,
        clean plating or container styling, subtle steam or condensation for realism,
        appetizing composition, clear visibility of texture and ingredients,
        focus on tempting food photography style"""
 
    # Cosmetics & Personal Care
    if any(word in description_lower for word in ['cosmetic', 'skincare', 'beauty', 'makeup', 'personal care', 'cream', 'lotion']):
        base_prompt += """, glossy or matte finish to highlight product texture,
        soft lighting to capture subtle details, chic aesthetic, emphasis on packaging design,
        crisp labeling and brand logos, premium beauty photography style,
        clean and minimalist arrangement"""
 
    # Furniture & Home Décor
    if any(word in description_lower for word in ['furniture', 'sofa', 'table', 'chair', 'decor', 'home decor', 'interior']):
        base_prompt += """, emphasis on form and function, highlight material texture,
        realistic room setting or context if needed, warm and inviting lighting,
        balanced composition focusing on design lines, high-res detail capture,
        décor styling that complements the piece"""
 
    # Sports & Fitness Gear
    if any(word in description_lower for word in ['fitness', 'sports', 'gym', 'workout', 'exercise', 'athletic', 'equipment']):
        base_prompt += """, dynamic lighting to emphasize performance aspect,
        athletic or energetic vibe, highlight durable materials and ergonomic design,
        bright, high-contrast style, clear brand logos and performance features,
        sturdy construction visible"""
 
    # Kids & Toys
    if any(word in description_lower for word in ['kids', 'toy', 'children', 'child', 'toddler', 'baby', 'play']):
        base_prompt += """, playful and colorful composition, bright and cheerful lighting,
        emphasize safety features and soft edges, focus on fun and imaginative elements,
        child-friendly design details, attention to whimsical or cartoon styling"""
 
    # Automotive Products
    if any(word in description_lower for word in ['automotive', 'car accessory', 'vehicle', 'car care', 'motorcycle']):
        base_prompt += """, sleek automotive aesthetic, metallic finishes where applicable,
        emphasis on durability and craftsmanship, detail in mechanical design,
        brand or model references if relevant, rugged environment or track setting if needed,
        polished reflections for a premium look"""
 
    # Tools & Hardware
    if any(word in description_lower for word in ['tool', 'hardware', 'utility', 'drill', 'hammer', 'screwdriver']):
        base_prompt += """, focus on robust construction, industrial lighting style,
        highlight steel or metal textures, close-up detail of functional parts,
        brand or model labeling visible, functional stance, minimal background clutter"""
 
    # Healthcare & Medical Devices
    if any(word in description_lower for word in ['medical', 'healthcare', 'hospital', 'patient', 'monitor', 'diagnostic']):
        base_prompt += """, clean and clinical look, sterile white or light blue background,
        emphasis on safety and precision, clearly visible user interface or display,
        brand or classification labeling, highlight ergonomic design,
        precise and organized composition"""
 
    # E-Commerce
    if any(word in description_lower for word in ['e-commerce', 'ecommerce', 'marketplace', 'online store', 'digital cart', 'web shop', 'online platform'    ]):        
        base_prompt += """, packaging design with clear branding, device screens or interface elements visible if relevant,
        minimalist background with emphasis on the product or brand,
        cohesive color scheme that aligns with online retail aesthetics,
        modern commercial style photography, promotional-style lighting"""
 
    # BFSI (Banking, Financial Services, Insurance)
    if any(word in description_lower for word in ['finance', 'bank', 'insurance', 'loan', 'credit', 'debit', 'investment', 'fintech', 'financial', 'accounting', 'tax', 'mortgage' ]):
        base_prompt += """, emphasis on trustworthiness and credibility,
        sleek corporate color palette, subtle brand identity elements,
        minimalistic yet professional lighting, well-defined details symbolizing security and reliability,
        neat composition illustrating professional standards"""
 
    # B2B Services (Enterprise / Corporate / Consulting)
    if any(word in description_lower for word in ['enterprise', 'company', 'organization','b2b', 'corporate solutions', 'business services', 'professional services', 'consulting', 'industrial']):
        base_prompt += """, polished corporate look, professional environment cues,
        well-defined brand imagery or placeholders, subtle references to collaboration,
        modern and sophisticated lighting, neutral color palette,
        focus on clarity and straightforward presentation, intangible services represented by abstract or symbolic visuals"""
 
 
     # Generate final enhanced prompt
    try:
        # Construct a clear instruction for Gemini to create a concise, paragraph-style prompt
        visualization_prompt = f"""
        As an expert product photographer, rewrite the following technical photography instructions into a single cohesive paragraph that directs an AI image generator to create ONE professional product photograph. Avoid numbered images, lists, or asterisks. Focus on creating a natural, flowing description of exactly what the final single image should look like:
 
        {base_prompt}
       
        Deliver your response as a single unified paragraph of instructions from the perspective of a professional product photographer directing a commercial shoot.
        """
 
        response = model.generate_content(visualization_prompt)
 
        print("Generated Visualization Prompt:")
        print(response.text)
        return response.text.strip()
   
    except Exception as e:
        print(f"Error in enhance_prompt: {str(e)}")
        return base_prompt
def generate_image_with_retry(client, prompt, initial_size=768, initial_steps=50, guidance_scale=7.5, max_retries=3, initial_delay=1):
    """
    Enhanced image generation with sophisticated retry and fallback mechanism
    
    Args:
        client: HuggingFace inference client
        prompt (str): Fully enhanced image generation prompt from enhance_prompt
        initial_size (int): Initial image size (default: 768)
        initial_steps (int): Initial inference steps (default: 50)
        guidance_scale (float): Guidance scale for generation (default: 7.5)
        max_retries (int): Maximum number of retry attempts (default: 3)
        initial_delay (int): Initial delay between retries in seconds (default: 1)
    
    Returns:
        tuple: (PIL.Image or None, error message or None)
    """
    # Fallback configurations ordered by priority
    fallback_configs = [
        {"size": 768, "steps": 50},    # First attempt - highest quality
        {"size": 768, "steps": 40},    # First fallback - reduce steps
        {"size": 768, "steps": 45},    # Second fallback - reduce size
        {"size": 768, "steps": 40},    # Third fallback - reduce both
        {"size": 512, "steps": 30}     # Last resort - minimum viable config
    ]
    
    last_error = None
    current_config_index = 0
    
    while current_config_index < len(fallback_configs):
        config = fallback_configs[current_config_index]
        current_size = config["size"]
        current_steps = config["steps"]
        
        # Prepare parameters for image generation
        parameters = {
            "width": current_size,
            "height": current_size,
            "num_inference_steps": current_steps,
            "guidance_scale": guidance_scale
        }
        
        for attempt in range(max_retries):
            try:
                # Validate and clean the prompt
                cleaned_prompt = re.sub(r'\s+', ' ', prompt).strip()
                
                # Truncate extremely long prompts
                max_prompt_length = 1000
                if len(cleaned_prompt) > max_prompt_length:
                    cleaned_prompt = cleaned_prompt[:max_prompt_length] + "..."
                
                # Image generation attempt
                response = client.post(
                    json={"inputs": cleaned_prompt, "parameters": parameters}
                )
                
                image = Image.open(io.BytesIO(response))
                
                # Log successful generation parameters
                print(f"Successfully generated image with size={current_size}, steps={current_steps} on attempt {attempt + 1}")
                
                return image, None
                
            except Exception as e:
                last_error = str(e)
                
                # Calculate exponential backoff with jitter
                delay = initial_delay * (2 ** attempt) + random.uniform(0, 0.5)
                
                # If not the last retry of current config, wait and try again
                if attempt < max_retries - 1:
                    time.sleep(delay)
                    print(f"Retrying with same parameters after {delay:.2f}s delay...")
                    continue
                
                # If all retries failed with current config, try next fallback
                print(f"Failed with size={current_size}, steps={current_steps}. Trying next fallback configuration...")
                break
        
        current_config_index += 1
    
    return None, f"Image generation failed after all fallback attempts. Last error: {last_error}"

# In views.py - Update generate_product_image function to use stored visualization_prompt

@api_view(['POST', 'GET', 'DELETE'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def generate_product_image(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            idea_id = data.get('idea_id')
            
            # Get the idea instance
            try:
                idea = get_object_or_404(Idea, id=idea_id)
            except Idea.DoesNotExist:
                return JsonResponse({
                    "success": False,
                    "error": "Invalid idea ID"
                }, status=404)
            
            # Ensure visualization prompt exists
            if not idea.visualization_prompt:
                return JsonResponse({
                    "success": False,
                    "error": "No visualization prompt found for this idea"
                }, status=400)

            print("Using stored visualization prompt for image generation:", idea.visualization_prompt)
            
            # Get generation parameters
            initial_size = min(max(data.get('size', 768), 512), 1024)
            initial_steps = min(max(data.get('steps', 50), 20), 100)
            guidance_scale = min(max(data.get('guidance_scale', 7.5), 1.0), 20.0)


            user_tokens = UserAPITokens.objects.get(user=request.user)

            HF_API_TOKEN = user_tokens.huggingface_token
            
            hf_client = InferenceClient(
                model="black-forest-labs/FLUX.1-schnell",
                token=HF_API_TOKEN
            )
            
            # Generate image using stored visualization_prompt
            try:
                image, error = generate_image_with_retry(
                    hf_client,
                    idea.visualization_prompt,  # Use stored prompt directly
                    initial_size=initial_size,
                    initial_steps=initial_steps,
                    guidance_scale=guidance_scale
                )
                
                if error or not image:
                    raise Exception(error or "Failed to generate image")
                
            except Exception as e:
                print(f"Image generation error: {str(e)}")
                return JsonResponse({
                    "success": False,
                    "error": f"Image generation failed: {str(e)}"
                }, status=500)
            
            # Process and save the generated image
            try:
                img_buffer = io.BytesIO()
                image.save(img_buffer, format="PNG")
                img_buffer.seek(0)
                
                # Create directory if it doesn't exist
                os.makedirs(os.path.join(settings.MEDIA_ROOT, 'generated_images'), exist_ok=True)
                
                # Generate unique filename
                filename = f"product_image_{idea_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.png"
                
                # Create GeneratedImage2 instance
                generated_image = GeneratedImage2.objects.create(
                    idea=idea,
                    prompt=idea.visualization_prompt,  # Store the visualization prompt
                    generation_status='pending',
                    parameters=json.dumps({
                        'size': initial_size,
                        'steps': initial_steps,
                        'guidance_scale': guidance_scale
                    })
                )
                
                # Save image file
                generated_image.image.save(filename, ContentFile(img_buffer.getvalue()))
                generated_image.generation_status = 'success'
                generated_image.save()
                
                # Convert to base64 for response
                img_str = base64.b64encode(img_buffer.getvalue()).decode()
                
                return JsonResponse({
                    "success": True,
                    "image": img_str,
                    "idea_id": idea_id,
                    "generated_image_id": generated_image.id,
                    "prompt_used": idea.visualization_prompt,  # Include the prompt used
                    "parameters": {
                        'size': initial_size,
                        'steps': initial_steps,
                        'guidance_scale': guidance_scale
                    }
                })
                
            except Exception as e:
                print(f"Error saving generated image: {str(e)}")
                if 'generated_image' in locals():
                    generated_image.generation_status = 'failed'
                    generated_image.save()
                return JsonResponse({
                    "success": False,
                    "error": f"Failed to save generated image: {str(e)}"
                }, status=500)
            
        except Exception as e:
            print(f"Unexpected error in generate_product_image: {str(e)}")
            return JsonResponse({
                "success": False,
                "error": str(e)
            }, status=500)

# In views.py

@api_view(['POST', 'GET', 'DELETE'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def regenerate_product_image(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            idea_id = data.get('idea_id')
            custom_prompt = data.get('description')  # Get custom prompt if provided
            
            try:
                idea = get_object_or_404(Idea, id=idea_id)
            except Idea.DoesNotExist:
                return JsonResponse({
                    "success": False,
                    "error": "Invalid idea ID"
                }, status=404)
            
            # Use custom prompt if provided, otherwise fallback to stored prompt
            prompt_to_use = custom_prompt if custom_prompt else idea.visualization_prompt
            
            if not prompt_to_use:
                return JsonResponse({
                    "success": False,
                    "error": "No visualization prompt found for this idea"
                }, status=400)

            print("Using prompt for regeneration:", prompt_to_use)
            
            # Get generation parameters
            size = min(max(data.get('size', 768), 512), 1024)
            steps = min(max(data.get('steps', 30), 20), 100)
            guidance_scale = min(max(data.get('guidance_scale', 7.5), 1.0), 20.0)
            negative_prompt = data.get('negative_prompt', '')


            user_tokens = UserAPITokens.objects.get(user=request.user)

            HF_API_TOKEN = user_tokens.huggingface_token
            
            hf_client = InferenceClient(
                model="black-forest-labs/FLUX.1-schnell",
                token=HF_API_TOKEN
            )
            
            # Generate image using the selected prompt
            try:
                image, error = generate_image_with_retry(
                    hf_client,
                    prompt_to_use,  # Use either custom or stored prompt
                    initial_size=size,
                    initial_steps=steps,
                    guidance_scale=guidance_scale
                )
                
                if error or not image:
                    raise Exception(error or "Failed to generate image")
                
            except Exception as e:
                print(f"Image regeneration error: {str(e)}")
                return JsonResponse({
                    "success": False,
                    "error": f"Image regeneration failed: {str(e)}"
                }, status=500)
            
            # Process and save the generated image
            try:
                img_buffer = io.BytesIO()
                image.save(img_buffer, format="PNG")
                img_buffer.seek(0)
                
                filename = f"product_image_regen_{idea_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.png"
                
                # Create GeneratedImage2 instance
                generated_image = GeneratedImage2.objects.create(
                    idea=idea,
                    prompt=prompt_to_use,  # Store the actual prompt used
                    generation_status='pending',
                    parameters=json.dumps({
                        'size': size,
                        'steps': steps,
                        'guidance_scale': guidance_scale,
                        'negative_prompt': negative_prompt,
                        'is_regenerated': True,
                        'used_custom_prompt': bool(custom_prompt)
                    })
                )
                
                generated_image.image.save(filename, ContentFile(img_buffer.getvalue()))
                generated_image.generation_status = 'success'
                generated_image.save()
                
                img_str = base64.b64encode(img_buffer.getvalue()).decode()
                
                return JsonResponse({
                    "success": True,
                    "image": img_str,
                    "idea_id": idea_id,
                    "generated_image_id": generated_image.id,
                    "prompt_used": prompt_to_use,
                    "parameters": {
                        'size': size,
                        'steps': steps,
                        'guidance_scale': guidance_scale,
                        'negative_prompt': negative_prompt,
                        'is_regenerated': True,
                        'used_custom_prompt': bool(custom_prompt)
                    }
                })
                
            except Exception as e:
                print(f"Error saving regenerated image: {str(e)}")
                if 'generated_image' in locals():
                    generated_image.generation_status = 'failed'
                    generated_image.save()
                return JsonResponse({
                    "success": False,
                    "error": f"Failed to save regenerated image: {str(e)}"
                }, status=500)
            
        except Exception as e:
            print(f"Unexpected error in regenerate_product_image: {str(e)}")
            return JsonResponse({
                "success": False,
                "error": str(e)
            }, status=500)
        
@api_view(['GET'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def get_idea_details(request, idea_id):
    """Fetch idea details including visualization prompt"""
    try:
        idea = get_object_or_404(Idea, id=idea_id)
        return JsonResponse({
            "success": True,
            "idea": {
                "id": idea.id,
                "product_name": idea.product_name,
                "description": idea.description,
                "visualization_prompt": idea.visualization_prompt,
                "enhanced_description": idea.enhanced_description
            }
        })
    except Exception as e:
        return JsonResponse({
            "success": False,
            "error": str(e)
        }, status=500)       
        

# views.py
def get_idea_history(request, idea_id):
    try:
        current_idea = get_object_or_404(Idea, id=idea_id)
        
        # Find the root idea and all its versions
        if current_idea.original_idea_id:
            # If this is a version, get the root idea
            root_idea_id = current_idea.original_idea_id
        else:
            # This is the root idea
            root_idea_id = current_idea.id
            
        # Get all versions related to this root idea including the root itself
        idea_versions = Idea.objects.filter(
            Q(id=root_idea_id) |  
            Q(original_idea_id=root_idea_id)
        ).order_by('created_at')
        
        # Determine if there are actual edits
        has_edits = idea_versions.count() > 1
        
        # Process idea versions
        version_data = []
        for version in idea_versions:
            version_data.append({
                'id': version.id,
                'product_name': version.product_name,
                'description': version.description,
                'created_at': version.created_at.isoformat(),
                'is_current': version.id == current_idea.id,
                'show_restore': version.id != current_idea.id  # Only show restore for non-current versions
            })
            
        # Get only images related to these specific versions
        image_versions = GeneratedImage2.objects.filter(
            idea_id__in=[v['id'] for v in version_data]
        ).order_by('-created_at')
        
        # Determine if there are multiple image generations
        has_multiple_images = image_versions.count() > 1
        
        image_data = []
        for img in image_versions:
            try:
                if img.image and os.path.exists(img.image.path):
                    with open(img.image.path, 'rb') as image_file:
                        image_base64 = base64.b64encode(image_file.read()).decode('utf-8')
                    
                    image_data.append({
                        'id': img.id,
                        'image_url': image_base64,
                        'created_at': img.created_at.isoformat(),
                        'parameters': img.parameters,
                        'idea_id': img.idea_id,
                        'is_regenerated': json.loads(img.parameters).get('is_regenerated', False) if img.parameters else False
                    })
            except Exception as file_error:
                print(f"Error processing image {img.id}: {file_error}")
        
        return JsonResponse({
            'success': True,
            'history': {
                'idea_versions': version_data,
                'image_versions': image_data,
                'has_idea_edits': has_edits,
                'has_multiple_images': has_multiple_images
            }
        })
    
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=400)

@api_view(['POST', 'GET', 'DELETE'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def restore_idea_version(request):
    try:
        data = json.loads(request.body)
        version_id = data.get('version_id')
        current_id = data.get('current_id')
        image_id = data.get('image_id')
        
        # Get the version to restore and its associated image
        version_idea = get_object_or_404(Idea, id=version_id)
        current_idea = get_object_or_404(Idea, id=current_id)
        
        # Create a new version with restored data
        restored_idea = Idea.objects.create(
            product_idea=current_idea.product_idea,
            product_name=version_idea.product_name,
            description=version_idea.description,
            original_idea_id=current_idea.id
        )
        
        # Retrieve all images associated with the original version
        original_images = GeneratedImage2.objects.filter(idea_id=version_id)
        
        # Copy all images from the original version
        restored_images = []
        restored_image_base64 = None
        for original_image in original_images:
            # Create a new image instance for each original image
            restored_image = GeneratedImage2.objects.create(
                idea=restored_idea,
                prompt=original_image.prompt,
                parameters=original_image.parameters,
                created_at=original_image.created_at  # Preserve original creation timestamp
            )
            
            # Copy the image file
            if original_image.image:
                restored_image.image.save(
                    original_image.image.name,
                    ContentFile(original_image.image.read())
                )
            
            restored_images.append(restored_image)
            
            # If this is the specified image or the first image, convert to base64
            if (image_id and original_image.id == image_id) or (not image_id and not restored_image_base64):
                with open(restored_image.image.path, 'rb') as img_file:
                    restored_image_base64 = base64.b64encode(img_file.read()).decode('utf-8')
        
        # Prepare image versions for response
        image_versions = []
        for img in restored_images:
            with open(img.image.path, 'rb') as img_file:
                image_base64 = base64.b64encode(img_file.read()).decode('utf-8')
                image_versions.append({
                    'id': img.id,
                    'image_url': image_base64,
                    'created_at': img.created_at.isoformat(),
                    'parameters': img.parameters
                })
        
        return JsonResponse({
            'success': True,
            'idea': {
                'id': restored_idea.id,
                'idea_id': restored_idea.id,
                'product_name': restored_idea.product_name,
                'description': restored_idea.description,
                'image_url': restored_image_base64,
                'images': image_versions  # Include all image versions
            }
        })
        
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        })


# views.py
from django.shortcuts import render, get_object_or_404
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
import json
from .models import Project, ProductIdea2, Idea, GeneratedImage2
from django.utils import timezone
from rest_framework.authentication import TokenAuthentication
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.decorators import api_view, authentication_classes, permission_classes


@api_view(['POST', 'GET', 'DELETE', 'PUT'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def project_operations(request, project_id=None):
    if not request.user.is_authenticated:
        return JsonResponse({
            'success': False,
            'error': 'Authentication required'
        }, status=401)
    
    main_project_id = request.GET.get('main_project_id') or request.data.get('main_project_id')
    if request.method == "GET":
        print("Starting project operations...")
        try:
            # Filter projects by user
            projects = Project.objects.filter(user=request.user, main_project_id=main_project_id).order_by('-last_modified')[:5]
            print(f"Found {projects.count()} projects for user {request.user.username}")
            
            project_list = []
            
            for project in projects:
                try:
                    # Filter product ideas by project and user
                    product_ideas = project.product_ideas.filter(user=request.user, )
                    print(f"\nProject {project.id} - {project.name}")
                    print(f"Has {product_ideas.count()} product ideas")
                    
                    latest_product_idea = product_ideas.first()
                    
                    accepted_ideas = []
                    for product_idea in product_ideas:
                        ideas = product_idea.ideas.all()
                        print(f"\nProduct idea {product_idea.id}")
                        print(f"Has {ideas.count()} ideas")
                        
                        for idea in ideas:
                            print(f"\nProcessing idea {idea.id} - {idea.product_name}")
                            
                            # Explicitly check for related images
                            all_images = GeneratedImage2.objects.filter(idea=idea)
                            successful_images = all_images.filter(generation_status='success')
                            
                            print(f"Total images found: {all_images.count()}")
                            print(f"Successful images: {successful_images.count()}")
                            
                            latest_image = successful_images.first()
                            
                            if latest_image:
                                print(f"Latest image details:")
                                print(f"- ID: {latest_image.id}")
                                print(f"- Status: {latest_image.generation_status}")
                                print(f"- Has image file: {bool(latest_image.image)}")
                                if latest_image.image:
                                    print(f"- Image path: {latest_image.image.path}")
                                    print(f"- Image URL: {latest_image.image.url}")
                            
                            image_url = None
                            if latest_image and latest_image.image:
                                try:
                                    image_url = latest_image.image.url
                                except Exception as img_error:
                                    print(f"Error getting image URL: {str(img_error)}")
                            
                            accepted_ideas.append({
                                'id': idea.id,
                                'title': idea.product_name,
                                'description': idea.description,
                                'image_url': image_url,
                                'debug_info': {
                                    'total_images': all_images.count(),
                                    'successful_images': successful_images.count(),
                                    'has_latest_image': bool(latest_image),
                                    'has_image_file': bool(latest_image.image) if latest_image else False,
                                    'generation_status': latest_image.generation_status if latest_image else None
                                }
                            })
                    
                    project_data = {
                        'id': project.id,
                        'name': project.name,
                        'created': project.created_at.isoformat(),
                        'lastModified': project.last_modified.isoformat(),
                        'acceptedIdeas': accepted_ideas,
                        'formData': {
                            'product': latest_product_idea.product if latest_product_idea else None,
                            'brand': latest_product_idea.brand if latest_product_idea else None,
                            'category': latest_product_idea.category if latest_product_idea else None,
                            'dynamicFields': latest_product_idea.dynamic_fields if latest_product_idea else {}
                        } if latest_product_idea else None
                    }
                    project_list.append(project_data)
                    
                except Exception as project_error:
                    print(f"Error processing project {project.id}: {str(project_error)}")
                    import traceback
                    print(f"Full traceback: {traceback.format_exc()}")
                    continue
            
            return JsonResponse({'success': True, 'projects': project_list})
            
        except Exception as e:
            print("Error in project_operations:", str(e))
            import traceback
            print("Full traceback:", traceback.format_exc())
            return JsonResponse({'success': False, 'error': str(e)})
        
    elif request.method == "POST":
        try:
            
            project_name = request.data.get('name')
            
            if not project_name:
                return JsonResponse({
                    'success': False,
                    'error': 'Project name is required'
                }, status=400)
            
            # Create new project with user
            project = Project.objects.create(
                
                name=project_name,
                created_at=timezone.now(),
                last_modified=timezone.now(),
                user=request.user,
                main_project_id=main_project_id, # Add user to project
            )
            
            # Create initial response data
            project_data = {
                'id': project.id,
                'name': project.name,
                'created': project.created_at.isoformat(),
                'lastModified': project.last_modified.isoformat(),
                'acceptedIdeas': [],
                'formData': None
            }
            
            return JsonResponse({
                'success': True,
                'project': project_data
            })
            
        except json.JSONDecodeError:
            return JsonResponse({
                'success': False,
                'error': 'Invalid JSON data'
            }, status=400)
            
        except Exception as e:
            print(f"Error creating project: {str(e)}")
            return JsonResponse({
                'success': False,
                'error': str(e)
            }, status=500)
        
    elif request.method == "DELETE":
        if not project_id:
            return JsonResponse({
                'success': False,
                'error': 'Project ID is required'
            }, status=400)
        try:
            # Filter by user
            project = get_object_or_404(Project, id=project_id, user=request.user)
            project.delete()
            return JsonResponse({
                'success': True,
                'message': 'Project deleted successfully'
            })
        except Exception as e:
            return JsonResponse({
                'success': False,
                'error': str(e)
            }, status=500)
        
    elif request.method == "PUT":
        try:
            project = get_object_or_404(Project, id=project_id, user=request.user)
            
            # Get the new name from request data
            new_name = request.data.get('name')
            if not new_name:
                return JsonResponse({
                    'success': False,
                    'error': 'Project name is required'
                }, status=400)
            
            # Update the project name
            project.name = new_name
            project.last_modified = timezone.now()
            project.save()
            
            return JsonResponse({
                'success': True,
                'project': {
                    'id': project.id,
                    'name': project.name,
                    'created': project.created_at.isoformat(),
                    'lastModified': project.last_modified.isoformat()
                }
            })
            
        except Exception as e:
            return JsonResponse({
                'success': False,
                'error': str(e)
            }, status=500)
        
    
            

@api_view(['GET'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def get_project(request, project_id):
    if request.method == "GET":
        try:
            project = get_object_or_404(Project, id=project_id, user=request.user)
            product_ideas = project.product_ideas.filter(user=request.user)
            latest_product_idea = product_ideas.first()
            
            # Get ALL ideas first (both accepted and unaccepted)
            all_ideas = []
            accepted_ideas = []
            all_idea_metadata = {}  # Store metadata for ALL ideas
            version_history = {}    # Store version history for all ideas
            
            # Get max set number for the project
            max_set = Idea.objects.filter(
                product_idea__project=project
            ).aggregate(Max('idea_set'))['idea_set__max'] or 0
            
            for product_idea in product_ideas:
                ideas = product_idea.ideas.all()
                for idea in ideas:
                    # Create the base idea data structure with set information
                    idea_data = {
                        'id': idea.id,
                        'idea_id': idea.id,
                        'title': idea.product_name,
                        'product_name': idea.product_name,
                        'description': idea.description,
                        'visualization_prompt': idea.visualization_prompt,  # Added this line(sourav 11-02-25)
                        'created_at': idea.created_at.isoformat(),
                        'idea_set': idea.idea_set,
                        'idea_set_label': idea.idea_set_label or f"Set {idea.idea_set}-1"
                    }
                    
                    idea_metadata = {
                        'baseData': {
                            'product': product_idea.product,
                            'category': product_idea.category,
                            'brand': product_idea.brand,
                            'number_of_ideas': product_idea.number_of_ideas,
                            'ideaSet': idea.idea_set,
                            'ideaSetLabel': idea.idea_set_label,
                            'negative_prompt': product_idea.negative_prompt,
                            'project_id': project.id,
                            'project_name': project.name,
                            'product_idea_id': idea.id,
                            'visualization_prompt': idea.visualization_prompt,
                        },
                        'dynamicFields': product_idea.dynamic_fields or {},
                        'timestamp': idea.created_at.isoformat()
                    }
                        
                    # Store metadata for ALL ideas
                    all_idea_metadata[str(idea.id)] = idea_metadata
                    
                    # Add to all_ideas with metadata
                    idea_data['metadata'] = idea_metadata
                    all_ideas.append(idea_data)

                    # Process accepted ideas (also include visualization_prompt)
                    if idea in accepted_ideas:
                        accepted_idea = idea_data.copy()
                        accepted_idea['visualization_prompt'] = idea.visualization_prompt
                        accepted_ideas.append(accepted_idea)
                    
                    # Handle image versions and history
                    image_versions = []
                    for image in idea.images.all().order_by('-created_at'):
                        if image and image.image:
                            try:
                                import base64
                                with open(image.image.path, 'rb') as img_file:
                                    image_data = base64.b64encode(img_file.read()).decode('utf-8')
                                
                                image_version = {
                                    'image_url': image_data,
                                    'created_at': image.created_at.isoformat(),
                                    'parameters': image.parameters if hasattr(image, 'parameters') else None,
                                }
                                image_versions.append(image_version)
                                
                                # If this is the latest image, use it for accepted ideas
                                if image == idea.images.first():
                                    # Add image and copy metadata to accepted idea
                                    accepted_idea = idea_data.copy()
                                    accepted_idea['image_url'] = f"data:image/{image.image.path.split('.')[-1]};base64,{image_data}"
                                    accepted_idea['visualization_prompt'] = idea.visualization_prompt  # Add this line
                                    accepted_ideas.append(accepted_idea)
                            except Exception as e:
                                print(f"Error processing image {image.id}: {str(e)}")
                                continue
                    
                    # Store version history for this idea
                    if image_versions:
                        version_history[str(idea.id)] = {
                            'image_versions': image_versions,
                            'idea_id': idea.id
                        }
            
            project_data = {
                'id': project.id,
                'name': project.name,
                'created': project.created_at.isoformat(),
                'lastModified': project.last_modified.isoformat(),
                'ideas': all_ideas,
                'acceptedIdeas': accepted_ideas,
                'formData': {
                    'product': latest_product_idea.product if latest_product_idea else None,
                    'brand': latest_product_idea.brand if latest_product_idea else None,
                    'category': latest_product_idea.category if latest_product_idea else None,
                    'dynamicFields': latest_product_idea.dynamic_fields if latest_product_idea else {},
                } if latest_product_idea else None,
                'ideaMetadata': all_idea_metadata,
                'versionHistory': version_history,
                'max_set_number': max_set
            }
            
            return JsonResponse({
                'success': True,
                'project': project_data
            })
            
        except Exception as e:
            return JsonResponse({
                'success': False,
                'error': str(e)
            })

@csrf_exempt
@require_http_methods(["DELETE", "OPTIONS"])
def delete_project(request, project_id):

    if request.method == "DELETE":
        try:
            project = get_object_or_404(Project, id=project_id)
            project.delete()
            return JsonResponse({
                'success': True,
                'message': 'Project deleted successfully'
            })
        except Exception as e:
            return JsonResponse({
                'success': False,
                'error': str(e)
            })
        
@api_view(['POST'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def generate_ideas_from_document(request):
    """
    API endpoint to generate ideas using parameters extracted from documents
    """
    try:
        data = json.loads(request.body)
        print("Received document-based idea generation data:", json.dumps(data, indent=2))
       
        # Extract document source information
        document_id = data.get('document_id')
        document_name = data.get('document_name')
        idea_parameters = data.get('idea_parameters', {})
       
        if not document_id or not idea_parameters:
            return JsonResponse({
                "success": False,
                "error": "Missing required parameters: document_id and idea_parameters"
            }, status=400)
       
        # Extract project information
        project_id = data.get('project_id')
        if not project_id:
            return JsonResponse({
                "success": False,
                "error": "project_id is required"
            }, status=400)
       
        # Get the project instance
        try:
            project = Project.objects.get(id=project_id, user=request.user)
        except Project.DoesNotExist:
            return JsonResponse({
                "success": False,
                "error": f"Project with id {project_id} does not exist"
            }, status=404)
       
        # Get current set number
        max_set_number = Idea.objects.filter(
            product_idea__project_id=project_id
        ).aggregate(Max('idea_set'))['idea_set__max'] or 0
        current_set = max_set_number + 1
       
        # Map document parameters to idea generator fields
        product = idea_parameters.get('Concept', '')
        brand = idea_parameters.get('Brand_Name', '')
        category = idea_parameters.get('Category', '')
        number_of_ideas = int(data.get('number_of_ideas', 3))  # Default to 3 ideas
        description_length = int(data.get('description_length', 70))  # New field with default value of 70
        
	# Convert document parameters to dynamic fields format
        dynamic_fields = {
            "benefits": idea_parameters.get('Benefits', ''),
            "rtb": idea_parameters.get('RTB', ''),
            "ingredients": idea_parameters.get('Ingredients', ''),
            "features": idea_parameters.get('Features', ''),
            "theme": idea_parameters.get('Theme', ''),
            "demographics": idea_parameters.get('Demographics', '')
        }
       
        # Remove empty values
        dynamic_fields = {k: v for k, v in dynamic_fields.items() if v}
       
        negative_prompt = data.get('negative_prompt', '')
       
        # Create ProductIdea2 instance
        product_idea = ProductIdea2.objects.create(
            user=request.user,
            project=project,
            product=product,
            brand=brand,
            category=category,
            number_of_ideas=number_of_ideas,
            description_length=description_length,  # New field
            dynamic_fields=dynamic_fields,
            negative_prompt=negative_prompt,
            source_document_id=document_id,
            source_document_name=document_name
        )
       

        user_tokens = UserAPITokens.objects.get(user=request.user)
        GOOGLE_API_KEY = user_tokens.gemini_token 
        # hf_api_token = user_tokens.huggingface_token 
        
        # Initialize APIs
        genai.configure(api_key=GOOGLE_API_KEY)
        model = genai.GenerativeModel('gemini-1.5-flash') 

        # Generate formatted prompt text
        formatted_dynamic_fields = generate_prompt_text(dynamic_fields)
       
        # Generate ideas using modified prompt logic to include brand name and description length
        ideas_prompt = (
            f"Generate {number_of_ideas} unique and creative product ideas for product named {product} from the brand {brand} with category {category}.\n"
            "While crafting these ideas, consider the following dynamic attributes as contextual guidelines. Use these inputs to shape the tone, style, and features of each idea so that they naturally resonate with the intended audience, without explicitly mentioning the attribute values.\n"
            f"Dynamic Attributes: {formatted_dynamic_fields}\n"
            f"IMPORTANT CONSTRAINTS: Avoid generating ideas that involve the following terms or concepts: {negative_prompt}\n"
            "If any generated idea contains or relates to these terms, immediately discard that idea and generate a completely different one.\n"
            f"CRITICAL REQUIREMENT: ALWAYS include the brand name '{brand}' at the beginning of each product name.\n"
            "Format each idea as a clean, valid JSON object with 'product_name' and 'description' fields, like this example:\n"
            f"{{  \"product_name\": \"{brand} Example Name\",\n  \"description\": \"Example description\"\n}}\n"
            "The 'description' should be clear, engaging, and written in simple language that highlights the product's key features and unique selling points. "
            "Ensure that the description explains how the product benefits the user and what makes it special, making it easy to visualize the idea, while seamlessly integrating the contextual cues from the dynamic attributes.\n"
            "Aim for a variety of ideas such that each is unique and creative, and focuses on different aspects of the product.\n"
            f"For each idea, provide a detailed explanation with exactly {description_length} words in the description."
        )
 
        print("Generated prompt for document-based idea generation:", ideas_prompt)
       
        response = model.generate_content(
            ideas_prompt,
            generation_config={
                'temperature': 1.0,
                # 'max_output_tokens': 4000
            }
        )
 
        print("Generated Ideas Response:", response.text)
       
        # Process generated ideas (using same logic as in original function)
        validated_ideas = []
        try:
            # Split the response into individual JSON objects
            json_objects = response.text.split('```json')
            cleaned_jsons = []
           
            for obj in json_objects:
                if obj.strip():
                    # Remove backticks and clean the JSON string
                    cleaned = obj.strip().strip('`').strip()
                    if cleaned:
                        cleaned_jsons.append(cleaned)
 
            print("Cleaned JSON objects:", cleaned_jsons)
           
            for index, json_text in enumerate(cleaned_jsons):
                try:
                    idea_data = json.loads(json_text)
                    print(f"Processing idea {index + 1}:", idea_data)
                   
                    if isinstance(idea_data, dict) and 'product_name' in idea_data and 'description' in idea_data:
                        # Ensure brand name is in product name
                        if not idea_data['product_name'].startswith(brand):
                            idea_data['product_name'] = f"{brand} {idea_data['product_name']}"
                        # Decompose and synthesize the idea
                        aspects = decompose_product_description(idea_data, model)
                        enhanced_description = synthesize_product_aspects(idea_data, aspects, model)
                       
                        # Generate visualization prompt
                        visualization_prompt = enhance_prompt(enhanced_description, model)
                       
                        # Create idea instance
                        idea_set_label = f"Set {current_set}-{index + 1}"
                        idea = Idea.objects.create(
                            product_idea=product_idea,
                            product_name=idea_data['product_name'],
                            description=idea_data['description'],
                            decomposed_aspects=aspects,
                            enhanced_description=enhanced_description,
                            visualization_prompt=visualization_prompt,
                            idea_set=current_set,
                            idea_set_label=idea_set_label
                        )
                       
                        validated_ideas.append({
                            'idea_id': idea.id,
                            'product_name': idea.product_name,
                            'description': idea.description,
                            'decomposed_aspects': aspects,
                            'enhanced_description': enhanced_description,
                            'visualization_prompt': visualization_prompt,
                            'idea_set': current_set,
                            'idea_set_label': idea_set_label
                        })
                        print(f"Successfully processed idea {index + 1}")
                except json.JSONDecodeError as e:
                    # Same fallback logic as in original function
                    print(f"Error parsing JSON for idea {index + 1}:", str(e))
                    try:
                        # Remove any trailing characters after the closing brace
                        cleaned_json = json_text.split('}')[0] + '}'
                        idea_data = json.loads(cleaned_json)

                        # Ensure brand name is in product name
                        if not idea_data['product_name'].startswith(brand):
                            idea_data['product_name'] = f"{brand} {idea_data['product_name']}"

                        # Process the idea same as above
                        aspects = decompose_product_description(idea_data, model)
                        enhanced_description = synthesize_product_aspects(idea_data, aspects, model)
                        visualization_prompt = enhance_prompt(enhanced_description, model)
                       
                        idea_set_label = f"Set {current_set}-{index + 1}"
                        idea = Idea.objects.create(
                            product_idea=product_idea,
                            product_name=idea_data['product_name'],
                            description=idea_data['description'],
                            decomposed_aspects=aspects,
                            enhanced_description=enhanced_description,
                            visualization_prompt=visualization_prompt,
                            idea_set=current_set,
                            idea_set_label=idea_set_label
                        )
                       
                        validated_ideas.append({
                            'idea_id': idea.id,
                            'product_name': idea.product_name,
                            'description': idea.description,
                            'decomposed_aspects': aspects,
                            'enhanced_description': enhanced_description,
                            'visualization_prompt': visualization_prompt,
                            'idea_set': current_set,
                            'idea_set_label': idea_set_label
                        })
                        print(f"Successfully processed idea {index + 1} after cleaning")
                    except Exception as e2:
                        print(f"Failed to process idea {index + 1} even after cleaning:", str(e2))
                        continue
                except Exception as e:
                    print(f"Unexpected error processing idea {index + 1}:", str(e))
                    continue
           
            # Fallback text parsing logic (same as original function)
            if not validated_ideas:
                print("No ideas processed from JSON, falling back to text parsing")
                lines = response.text.split('\n')
                current_name = None
                current_description = []
               
                for line in lines:
                    if ' - ' in line:
                        # Process previous idea if exists
                        if current_name and current_description:
                            description_text = ' '.join(current_description)
                           
                            # Ensure brand name is in product name
                            if not current_name.startswith(brand):
                                current_name = f"{brand} {current_name}"
                            idea_data = {
                                'product_name': current_name,
                                'description': description_text
                            }
                           
                            aspects = decompose_product_description(idea_data, model)
                            enhanced_description = synthesize_product_aspects(idea_data, aspects, model)
                            visualization_prompt = enhance_prompt(enhanced_description, model)
                           
                            idea_set_label = f"Set {current_set}-{len(validated_ideas) + 1}"
                            idea = Idea.objects.create(
                                product_idea=product_idea,
                                product_name=current_name,
                                description=description_text,
                                decomposed_aspects=aspects,
                                enhanced_description=enhanced_description,
                                visualization_prompt=visualization_prompt,
                                idea_set=current_set,
                                idea_set_label=idea_set_label
                            )
                           
                            validated_ideas.append({
                                'idea_id': idea.id,
                                'product_name': idea.product_name,
                                'description': idea.description,
                                'decomposed_aspects': aspects,
                                'enhanced_description': enhanced_description,
                                'visualization_prompt': visualization_prompt,
                                'idea_set': current_set,
                                'idea_set_label': idea_set_label
                            })
                       
                        # Start new idea
                        name_part, desc_part = line.split(' - ', 1)
                        current_name = name_part.strip()
                        current_description = [desc_part.strip()]
                    elif line.strip() and current_name:
                        current_description.append(line.strip())
               
                # Process the last idea if exists
                if current_name and current_description:
                    description_text = ' '.join(current_description)
                    # Ensure brand name is in product name
                    if not current_name.startswith(brand):
                        current_name = f"{brand} {current_name}"
                    idea_data = {
                        'product_name': current_name,
                        'description': description_text
                    }
                   
                    aspects = decompose_product_description(idea_data, model)
                    enhanced_description = synthesize_product_aspects(idea_data, aspects, model)
                    visualization_prompt = enhance_prompt(enhanced_description, model)
                   
                    idea_set_label = f"Set {current_set}-{len(validated_ideas) + 1}"
                    idea = Idea.objects.create(
                        product_idea=product_idea,
                        product_name=current_name,
                        description=description_text,
                        decomposed_aspects=aspects,
                        enhanced_description=enhanced_description,
                        visualization_prompt=visualization_prompt,
                        idea_set=current_set,
                        idea_set_label=idea_set_label
                    )
                   
                    validated_ideas.append({
                        'idea_id': idea.id,
                        'product_name': idea.product_name,
                        'description': idea.description,
                        'decomposed_aspects': aspects,
                        'enhanced_description': enhanced_description,
                        'visualization_prompt': visualization_prompt,
                        'idea_set': current_set,
                        'idea_set_label': idea_set_label
                    })
 
        except Exception as e:
            print(f"Error in idea processing: {str(e)}")
            raise
 
        print("Final validated ideas:", json.dumps(validated_ideas, indent=2))
       
        response_data = {
            "success": True,
            "ideas": validated_ideas,
            "stored_data": {
                "product_idea_id": product_idea.id,
                "project_id": project.id,
                "project_name": project.name,
                "product": product_idea.product,
                "brand": product_idea.brand,
                "category": product_idea.category,
                "dynamic_fields": product_idea.dynamic_fields,
                "current_set": current_set,
                "negative_prompt": negative_prompt,
                "source_document_id": document_id,
                "source_document_name": document_name
            }
        }
 
        print("Sending response:", json.dumps(response_data, indent=2))
       
        return JsonResponse(response_data)
       
    except Exception as e:
        print("Error in document-based idea generation:", str(e))
        return JsonResponse({
            "success": False,
            "error": str(e)
        }, status=500)        
        
# @api_view(['POST'])
# @authentication_classes([TokenAuthentication])
# @permission_classes([IsAuthenticated])
# def generate_ideas_from_document(request):
#     """
#     API endpoint to generate ideas using parameters extracted from documents
#     """
#     try:
#         data = json.loads(request.body)
#         print("Received document-based idea generation data:", json.dumps(data, indent=2))
       
#         # Extract document source information
#         document_id = data.get('document_id')
#         document_name = data.get('document_name')
#         idea_parameters = data.get('idea_parameters', {})
       
#         if not document_id or not idea_parameters:
#             return JsonResponse({
#                 "success": False,
#                 "error": "Missing required parameters: document_id and idea_parameters"
#             }, status=400)
       
#         # Extract project information
#         project_id = data.get('project_id')
#         if not project_id:
#             return JsonResponse({
#                 "success": False,
#                 "error": "project_id is required"
#             }, status=400)
       
#         # Get the project instance
#         try:
#             project = Project.objects.get(id=project_id, user=request.user)
#         except Project.DoesNotExist:
#             return JsonResponse({
#                 "success": False,
#                 "error": f"Project with id {project_id} does not exist"
#             }, status=404)
       
#         # Get current set number
#         max_set_number = Idea.objects.filter(
#             product_idea__project_id=project_id
#         ).aggregate(Max('idea_set'))['idea_set__max'] or 0
#         current_set = max_set_number + 1
       
#         # Map document parameters to idea generator fields
#         product = idea_parameters.get('Concept', '')
#         brand = idea_parameters.get('Brand_Name', '')
#         category = idea_parameters.get('Category', '')
#         number_of_ideas = int(data.get('number_of_ideas', 3))  # Default to 3 ideas
       
#         # Convert document parameters to dynamic fields format
#         dynamic_fields = {
#             "benefits": idea_parameters.get('Benefits', ''),
#             "rtb": idea_parameters.get('RTB', ''),
#             "ingredients": idea_parameters.get('Ingredients', ''),
#             "features": idea_parameters.get('Features', ''),
#             "theme": idea_parameters.get('Theme', ''),
#             "demographics": idea_parameters.get('Demographics', '')
#         }
       
#         # Remove empty values
#         dynamic_fields = {k: v for k, v in dynamic_fields.items() if v}
       
#         negative_prompt = data.get('negative_prompt', '')
       
#         # Create ProductIdea2 instance
#         product_idea = ProductIdea2.objects.create(
#             user=request.user,
#             project=project,
#             product=product,
#             brand=brand,
#             category=category,
#             number_of_ideas=number_of_ideas,
#             dynamic_fields=dynamic_fields,
#             negative_prompt=negative_prompt,
#             source_document_id=document_id,
#             source_document_name=document_name
#         )
       

#         user_tokens = UserAPITokens.objects.get(user=request.user)
#         GOOGLE_API_KEY = user_tokens.gemini_token 
#         # hf_api_token = user_tokens.huggingface_token 
        
#         # Initialize APIs
#         genai.configure(api_key=GOOGLE_API_KEY)
#         model = genai.GenerativeModel('gemini-1.5-flash') 


#         # Generate formatted prompt text
#         formatted_dynamic_fields = generate_prompt_text(dynamic_fields)

       
#         # Generate ideas using existing prompt logic
#         ideas_prompt = (
#                 f"Generate {number_of_ideas} unique and creative product ideas for product named {product} from the brand {brand} with category {category}.\n"
#                 "While crafting these ideas, consider the following dynamic attributes as contextual guidelines. Use these inputs to shape the tone, style, and features of each idea so that they naturally resonate with the intended audience, without explicitly mentioning the attribute values.\n"
#                 f"Dynamic Attributes: {formatted_dynamic_fields}\n"
#                 f"IMPORTANT CONSTRAINTS: Avoid generating ideas that involve the following terms or concepts: {negative_prompt}\n"
#                 "If any generated idea contains or relates to these terms, immediately discard that idea and generate a completely different one.\n"
#                 f"CRITICAL REQUIREMENT: ALWAYS include the brand name '{brand}' at the beginning of each product name.\n"
#                 "Format each idea as a clean, valid JSON object with 'product_name' and 'description' fields, like this example:\n"
#                 f"{{  \"product_name\": \"{brand} Example Name\",\n  \"description\": \"Example description\"\n}}\n"
#                 "The 'description' should be clear, engaging, and written in simple language that highlights the product's key features and unique selling points. "
#                 "Ensure that the description explains how the product benefits the user and what makes it special, making it easy to visualize the idea, while seamlessly integrating the contextual cues from the dynamic attributes.\n"
#                 "Aim for a variety of ideas such that each is unique and creative, and focuses on different aspects of the product.\n"
#                 "For each idea, provide a detailed explanation with exact 60-75 words in the description."
#             )
 
#         print("Generated prompt for document-based idea generation:", ideas_prompt)
       
#         response = model.generate_content(
#             ideas_prompt,
#             generation_config={
#                 'temperature': 1.0,
#                 # 'max_output_tokens': 4000
#             }
#         )
 
#         print("Generated Ideas Response:", response.text)
       
#         # Process generated ideas (using same logic as in original function)
#         validated_ideas = []
#         try:
#             # Split the response into individual JSON objects
#             json_objects = response.text.split('```json')
#             cleaned_jsons = []
           
#             for obj in json_objects:
#                 if obj.strip():
#                     # Remove backticks and clean the JSON string
#                     cleaned = obj.strip().strip('`').strip()
#                     if cleaned:
#                         cleaned_jsons.append(cleaned)
 
#             print("Cleaned JSON objects:", cleaned_jsons)
           
#             for index, json_text in enumerate(cleaned_jsons):
#                 try:
#                     idea_data = json.loads(json_text)
#                     print(f"Processing idea {index + 1}:", idea_data)
                   
#                     if isinstance(idea_data, dict) and 'product_name' in idea_data and 'description' in idea_data:
#                         # Decompose and synthesize the idea
#                         aspects = decompose_product_description(idea_data, model)
#                         enhanced_description = synthesize_product_aspects(idea_data, aspects, model)
                       
#                         # Generate visualization prompt
#                         visualization_prompt = enhance_prompt(enhanced_description, model)
                       
#                         # Create idea instance
#                         idea_set_label = f"Set {current_set}-{index + 1}"
#                         idea = Idea.objects.create(
#                             product_idea=product_idea,
#                             product_name=idea_data['product_name'],
#                             description=idea_data['description'],
#                             decomposed_aspects=aspects,
#                             enhanced_description=enhanced_description,
#                             visualization_prompt=visualization_prompt,
#                             idea_set=current_set,
#                             idea_set_label=idea_set_label
#                         )
                       
#                         validated_ideas.append({
#                             'idea_id': idea.id,
#                             'product_name': idea.product_name,
#                             'description': idea.description,
#                             'decomposed_aspects': aspects,
#                             'enhanced_description': enhanced_description,
#                             'visualization_prompt': visualization_prompt,
#                             'idea_set': current_set,
#                             'idea_set_label': idea_set_label
#                         })
#                         print(f"Successfully processed idea {index + 1}")
#                 except json.JSONDecodeError as e:
#                     # Same fallback logic as in original function
#                     print(f"Error parsing JSON for idea {index + 1}:", str(e))
#                     try:
#                         # Remove any trailing characters after the closing brace
#                         cleaned_json = json_text.split('}')[0] + '}'
#                         idea_data = json.loads(cleaned_json)
#                         # Process the idea same as above
#                         aspects = decompose_product_description(idea_data, model)
#                         enhanced_description = synthesize_product_aspects(idea_data, aspects, model)
#                         visualization_prompt = enhance_prompt(enhanced_description, model)
                       
#                         idea_set_label = f"Set {current_set}-{index + 1}"
#                         idea = Idea.objects.create(
#                             product_idea=product_idea,
#                             product_name=idea_data['product_name'],
#                             description=idea_data['description'],
#                             decomposed_aspects=aspects,
#                             enhanced_description=enhanced_description,
#                             visualization_prompt=visualization_prompt,
#                             idea_set=current_set,
#                             idea_set_label=idea_set_label
#                         )
                       
#                         validated_ideas.append({
#                             'idea_id': idea.id,
#                             'product_name': idea.product_name,
#                             'description': idea.description,
#                             'decomposed_aspects': aspects,
#                             'enhanced_description': enhanced_description,
#                             'visualization_prompt': visualization_prompt,
#                             'idea_set': current_set,
#                             'idea_set_label': idea_set_label
#                         })
#                         print(f"Successfully processed idea {index + 1} after cleaning")
#                     except Exception as e2:
#                         print(f"Failed to process idea {index + 1} even after cleaning:", str(e2))
#                         continue
#                 except Exception as e:
#                     print(f"Unexpected error processing idea {index + 1}:", str(e))
#                     continue
           
#             # Fallback text parsing logic (same as original function)
#             if not validated_ideas:
#                 print("No ideas processed from JSON, falling back to text parsing")
#                 lines = response.text.split('\n')
#                 current_name = None
#                 current_description = []
               
#                 for line in lines:
#                     if ' - ' in line:
#                         # Process previous idea if exists
#                         if current_name and current_description:
#                             description_text = ' '.join(current_description)
                           
#                             idea_data = {
#                                 'product_name': current_name,
#                                 'description': description_text
#                             }
                           
#                             aspects = decompose_product_description(idea_data, model)
#                             enhanced_description = synthesize_product_aspects(idea_data, aspects, model)
#                             visualization_prompt = enhance_prompt(enhanced_description, model)
                           
#                             idea_set_label = f"Set {current_set}-{len(validated_ideas) + 1}"
#                             idea = Idea.objects.create(
#                                 product_idea=product_idea,
#                                 product_name=current_name,
#                                 description=description_text,
#                                 decomposed_aspects=aspects,
#                                 enhanced_description=enhanced_description,
#                                 visualization_prompt=visualization_prompt,
#                                 idea_set=current_set,
#                                 idea_set_label=idea_set_label
#                             )
                           
#                             validated_ideas.append({
#                                 'idea_id': idea.id,
#                                 'product_name': idea.product_name,
#                                 'description': idea.description,
#                                 'decomposed_aspects': aspects,
#                                 'enhanced_description': enhanced_description,
#                                 'visualization_prompt': visualization_prompt,
#                                 'idea_set': current_set,
#                                 'idea_set_label': idea_set_label
#                             })
                       
#                         # Start new idea
#                         name_part, desc_part = line.split(' - ', 1)
#                         current_name = name_part.strip()
#                         current_description = [desc_part.strip()]
#                     elif line.strip() and current_name:
#                         current_description.append(line.strip())
               
#                 # Process the last idea if exists
#                 if current_name and current_description:
#                     description_text = ' '.join(current_description)
#                     idea_data = {
#                         'product_name': current_name,
#                         'description': description_text
#                     }
                   
#                     aspects = decompose_product_description(idea_data, model)
#                     enhanced_description = synthesize_product_aspects(idea_data, aspects, model)
#                     visualization_prompt = enhance_prompt(enhanced_description, model)
                   
#                     idea_set_label = f"Set {current_set}-{len(validated_ideas) + 1}"
#                     idea = Idea.objects.create(
#                         product_idea=product_idea,
#                         product_name=current_name,
#                         description=description_text,
#                         decomposed_aspects=aspects,
#                         enhanced_description=enhanced_description,
#                         visualization_prompt=visualization_prompt,
#                         idea_set=current_set,
#                         idea_set_label=idea_set_label
#                     )
                   
#                     validated_ideas.append({
#                         'idea_id': idea.id,
#                         'product_name': idea.product_name,
#                         'description': idea.description,
#                         'decomposed_aspects': aspects,
#                         'enhanced_description': enhanced_description,
#                         'visualization_prompt': visualization_prompt,
#                         'idea_set': current_set,
#                         'idea_set_label': idea_set_label
#                     })
 
#         except Exception as e:
#             print(f"Error in idea processing: {str(e)}")
#             raise
 
#         print("Final validated ideas:", json.dumps(validated_ideas, indent=2))
       
#         response_data = {
#             "success": True,
#             "ideas": validated_ideas,
#             "stored_data": {
#                 "product_idea_id": product_idea.id,
#                 "project_id": project.id,
#                 "project_name": project.name,
#                 "product": product_idea.product,
#                 "brand": product_idea.brand,
#                 "category": product_idea.category,
#                 "dynamic_fields": product_idea.dynamic_fields,
#                 "current_set": current_set,
#                 "negative_prompt": negative_prompt,
#                 "source_document_id": document_id,
#                 "source_document_name": document_name
#             }
#         }
 
#         print("Sending response:", json.dumps(response_data, indent=2))
       
#         return JsonResponse(response_data)
       
#     except Exception as e:
#         print("Error in document-based idea generation:", str(e))
#         return JsonResponse({
#             "success": False,
#             "error": str(e)
#         }, status=500)
