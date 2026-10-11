build-Backend:
	python3 -m pip install -r requirements.txt --target "$(ARTIFACTS_DIR)"
	python3 -c "import os, shutil; shutil.copytree('app', os.path.join(os.environ['ARTIFACTS_DIR'], 'app'), dirs_exist_ok=True, ignore=shutil.ignore_patterns('__pycache__', '*.pyc'))"
