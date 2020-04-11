IMAGE_NAME=node:lts
CONTAINER_NAME=quill

.PHONEY: dev build serve

dev:
	docker run -it \
		-v $(shell pwd):/workspace \
		-p "8080:8080" \
		-w /workspace/ \
		--user node \
		--name ${CONTAINER_NAME}-dev \
		--rm \
		${IMAGE_NAME} bash

build:
	docker run -it \
		-v $(shell pwd):/workspace \
		-w /workspace/ \
		--user node \
		--name ${CONTAINER_NAME}-build \
		--rm \
		${IMAGE_NAME} npm run build

serve:
	docker run -it \
		-v $(shell pwd)/dist:/usr/share/nginx/html \
		-p "8082:80" \
		--name ${CONTAINER_NAME}-nginx \
		--rm \
		nginx:mainline-alpine
