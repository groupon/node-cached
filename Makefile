COFFEE=node_modules/.bin/coffee

build:
	$(COFFEE) -cbo lib src
	@./node_modules/.bin/npub prep lib

clean:
	rm -rf node_modules

setup:
	npm install

release-%: clean setup
	./node_modules/.bin/npub publish $(subst release-,,$@)
