.PHONY: clean setup

setup:
	npm install

clean:
	rm -rf node_modules

release-%: clean setup
	./node_modules/.bin/npub publish $(subst release-,,$@)
