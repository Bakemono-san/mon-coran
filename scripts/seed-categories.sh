#!/bin/bash

API_URL="${API_URL:-http://localhost:8080/api/category}"

post_category () {
  curl -s -X POST "$API_URL" \
    -H "Content-Type: application/json" \
    -d "$1"
  echo -e "\n----------------------\n"
}

# 1. Véhicules
post_category '{
  "category": { "name": "Véhicules", "description": "Voitures, motos, pièces", "slug": "vehicles" },
  "schema": {
    "version": 1,
    "schema": {
      "type": "object",
      "required": ["title","price","brand","model","location"],
      "properties": {
        "title": {"type":"string"},
        "price": {"type":"number"},
        "brand": {"type":"string"},
        "model": {"type":"string"},
        "year": {"type":"number"},
        "condition": {"type":"string","enum":["new","used"]},
        "location": {"type":"string"},
        "description": {"type":"string"}
      }
    },
    "uiMeta": {},
    "status": "ACTIVE"
  }
}'

# 2. Multimédia
post_category '{
  "category": { "name": "Multimédia", "description": "Téléphones, PC, TV", "slug": "multimedia" },
  "schema": {
    "version": 1,
    "schema": {
      "type": "object",
      "required": ["title","price","brand","location"],
      "properties": {
        "title": {"type":"string"},
        "price": {"type":"number"},
        "brand": {"type":"string"},
        "condition": {"type":"string","enum":["new","used"]},
        "location": {"type":"string"},
        "description": {"type":"string"}
      }
    },
    "uiMeta": {},
    "status": "ACTIVE"
  }
}'

# 3. Immobilier
post_category '{
  "category": { "name": "Immobilier", "description": "Biens immobiliers", "slug": "real-estate" },
  "schema": {
    "version": 1,
    "schema": {
      "type": "object",
      "required": ["title","price","type","location"],
      "properties": {
        "title": {"type":"string"},
        "price": {"type":"number"},
        "type": {"type":"string","enum":["appartement","maison","terrain","bureau"]},
        "surface": {"type":"number"},
        "rooms": {"type":"number"},
        "location": {"type":"string"},
        "description": {"type":"string"}
      }
    },
    "uiMeta": {},
    "status": "ACTIVE"
  }
}'

# 4. Maison & Bureau
post_category '{
  "category": { "name": "Maison & Bureau", "description": "Meubles et équipements", "slug": "home" },
  "schema": {
    "version": 1,
    "schema": {
      "type": "object",
      "required": ["title","price","location"],
      "properties": {
        "title": {"type":"string"},
        "price": {"type":"number"},
        "condition": {"type":"string","enum":["new","used"]},
        "location": {"type":"string"},
        "description": {"type":"string"}
      }
    },
    "uiMeta": {},
    "status": "ACTIVE"
  }
}'

# 5. Mode & Beauté
post_category '{
  "category": { "name": "Mode & Beauté", "description": "Vêtements et accessoires", "slug": "fashion" },
  "schema": {
    "version": 1,
    "schema": {
      "type": "object",
      "required": ["title","price","location"],
      "properties": {
        "title": {"type":"string"},
        "price": {"type":"number"},
        "size": {"type":"string"},
        "brand": {"type":"string"},
        "location": {"type":"string"},
        "description": {"type":"string"}
      }
    },
    "uiMeta": {},
    "status": "ACTIVE"
  }
}'

# 6. Sport & Loisirs
post_category '{
  "category": { "name": "Sport & Loisirs", "description": "Équipements sportifs", "slug": "sports" },
  "schema": {
    "version": 1,
    "schema": {
      "type": "object",
      "required": ["title","price","location"],
      "properties": {
        "title": {"type":"string"},
        "price": {"type":"number"},
        "type": {"type":"string"},
        "location": {"type":"string"},
        "description": {"type":"string"}
      }
    },
    "uiMeta": {},
    "status": "ACTIVE"
  }
}'

# 7. Matériaux & Outils
post_category '{
  "category": { "name": "Matériaux & Outils", "description": "Construction et outils", "slug": "tools" },
  "schema": {
    "version": 1,
    "schema": {
      "type": "object",
      "required": ["title","price","location"],
      "properties": {
        "title": {"type":"string"},
        "price": {"type":"number"},
        "condition": {"type":"string"},
        "location": {"type":"string"},
        "description": {"type":"string"}
      }
    },
    "uiMeta": {},
    "status": "ACTIVE"
  }
}'

# 8. Agroalimentaire
post_category '{
  "category": { "name": "Agroalimentaire", "description": "Produits alimentaires", "slug": "agro" },
  "schema": {
    "version": 1,
    "schema": {
      "type": "object",
      "required": ["title","price","location"],
      "properties": {
        "title": {"type":"string"},
        "price": {"type":"number"},
        "quantity": {"type":"number"},
        "location": {"type":"string"},
        "description": {"type":"string"}
      }
    },
    "uiMeta": {},
    "status": "ACTIVE"
  }
}'

# 9. Animaux
post_category '{
  "category": { "name": "Animaux", "description": "Animaux domestiques", "slug": "animals" },
  "schema": {
    "version": 1,
    "schema": {
      "type": "object",
      "required": ["title","price","location"],
      "properties": {
        "title": {"type":"string"},
        "price": {"type":"number"},
        "breed": {"type":"string"},
        "age": {"type":"number"},
        "location": {"type":"string"},
        "description": {"type":"string"}
      }
    },
    "uiMeta": {},
    "status": "ACTIVE"
  }
}'

# 10. Offres d'emploi
post_category '{
  "category": { "name": "Offres d'\''emploi", "description": "Jobs disponibles", "slug": "jobs" },
  "schema": {
    "version": 1,
    "schema": {
      "type": "object",
      "required": ["title","company","location"],
      "properties": {
        "title": {"type":"string"},
        "company": {"type":"string"},
        "salary": {"type":"number"},
        "contractType": {"type":"string"},
        "location": {"type":"string"},
        "description": {"type":"string"}
      }
    },
    "uiMeta": {},
    "status": "ACTIVE"
  }
}'

# 11. Demandes d'emploi
post_category '{
  "category": { "name": "Demandes d'\''emploi", "description": "Candidatures", "slug": "job-requests" },
  "schema": {
    "version": 1,
    "schema": {
      "type": "object",
      "required": ["title","location"],
      "properties": {
        "title": {"type":"string"},
        "experience": {"type":"number"},
        "skills": {"type":"string"},
        "location": {"type":"string"},
        "description": {"type":"string"}
      }
    },
    "uiMeta": {},
    "status": "ACTIVE"
  }
}'

# 12. Services
post_category '{
  "category": { "name": "Services", "description": "Prestations de services", "slug": "services" },
  "schema": {
    "version": 1,
    "schema": {
      "type": "object",
      "required": ["title","location"],
      "properties": {
        "title": {"type":"string"},
        "price": {"type":"number"},
        "serviceType": {"type":"string"},
        "location": {"type":"string"},
        "description": {"type":"string"}
      }
    },
    "uiMeta": {},
    "status": "ACTIVE"
  }
}'
