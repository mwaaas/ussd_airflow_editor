image=mwaaas/ussd_airflow_editor
version=latest
repo=$(image):$(version)

deploy:
	@docker build -t $(repo) .
	@docker push $(repo)

