#!/bin/bash

build() {
	if [ -d "./public" ]; then
		echo "Need to run 'deploy.sh clear'"
		exit 1
	fi

	echo "Start building"
	mkdir ./public
	cp -r ./res ./public/res

	echo "Handling JavaScript"
	for file in config.js core.js game.js i18n.js sw.js; do
		google-closure-compiler --js ./"$file" --js_output_file ./public/"$file"
	done
	while IFS= read -r -d '' file; do
		google-closure-compiler --js "$file" --js_output_file ./public/"$file"
	done < <(find ./js -type f -print0)
	mkdir ./public/lib
	for i in react.min.js jQuery.js dojo.xd.js lz-string.js system.js; do
		cp ./lib/$i ./public/lib/
	done

	echo "Handling other files"
	cp ./changelog.txt ./public
	cp ./index.html ./public
	cp ./server.json ./public

	echo "Generate build version"
	node generate-buildver.cjs

}

clear() {
	rm -rf ./public*
}

case "$1" in
clear)
	clear
	;;
build)
	build
	;;
esac

exit 0
