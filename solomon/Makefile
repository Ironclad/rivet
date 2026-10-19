.PHONY: help install run test clean docker docker-run docker-stop deploy seed reset-db

help:
	@echo "Solomon v4.0 - Available Commands:"
	@echo "  make install      - Install Python dependencies"
	@echo "  make run          - Run development server"
	@echo "  make test         - Run all tests"
	@echo "  make clean        - Clean cache files"
	@echo "  make docker       - Build Docker image"
	@echo "  make docker-run   - Run Docker container"
	@echo "  make docker-stop  - Stop Docker container"
	@echo "  make seed         - Seed demo data"
	@echo "  make reset-db     - Reset database (delete + reseed)"
	@echo "  make deploy       - Deploy to Render.com (requires git push first)"

install:
	pip install -r requirements.txt

run:
	python3 wsgi.py

test:
	pytest tests/ -v --tb=short

test-coverage:
	pytest tests/ --cov=app --cov-report=html --cov-report=term

clean:
	find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
	find . -type f -name "*.pyc" -delete
	rm -rf .pytest_cache .coverage htmlcov

docker:
	docker build -t solomon:latest .

docker-run:
	docker-compose up -d
	@echo "✅ Solomon running at http://localhost:5000"

docker-stop:
	docker-compose down

docker-logs:
	docker-compose logs -f

seed:
	python3 -c "from app import create_app; app = create_app(); print('✅ Seeded')"

reset-db:
	rm -f instance/solomon.db
	python3 -c "from app import create_app; app = create_app(); print('✅ Database reset + reseeded')"

deploy:
	git add -A
	git commit -m "deploy: $(shell date +'%Y-%m-%d %H:%M:%S')"
	git push origin arena/01a07482-rivet
	@echo "✅ Pushed to GitHub - Render will auto-deploy"

shell:
	python3 -c "from app import create_app; from app.extensions import db; app = create_app(); ctx = app.app_context(); ctx.push(); import IPython; IPython.embed()"

format:
	black app/ tests/

lint:
	flake8 app/ --max-line-length=120 --statistics
