import fs from 'fs';
import path from 'path';

import { createFilter } from 'rollup-pluginutils';

const componentRegex = /@(Component)\({([\s\S]*)}\)$/gm;
const templateUrlRegex = /templateUrl\s*:(.*)/g;
const styleUrlsRegex = /styleUrls\s*:(\s*\[[\s\S]*?\])/g;
const stringRegex = /(['"])((?:[^\\]\\\1|.)*?)\1/g;

function insertText(str, dir) {
  str = str.replace(stringRegex, function (match, quote, url) {
    var text = fs.readFileSync(path.join(dir, url)).toString();
    return '`' + text + '`';
  });
  return str;
}

export default function angular (options = {}) {
  var filter = createFilter(options.include, options.exclude);

  return {
    name: 'angular',
    transform(source, map) {
      if (!filter(map)) return;

      var dir = path.parse(map).dir;

      source = source.replace(componentRegex, function (match, decorator, metadata) {
        metadata = metadata
          .replace(templateUrlRegex, function (match, url) {
            return 'template:' + insertText(url, dir);
          })
          .replace(styleUrlsRegex, function (match, urls) {
            return 'styles:' + insertText(urls, dir);
          });

          return '@' + decorator + '({' + metadata + '})';
      });

      return {
        code: source,
        map: { mappings: '' }
      };
    }
  };
}
