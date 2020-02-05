exports.optimize = true;

exports.paths = {
  watched: ['app/assets', 'app/styles', 'app/views', 'app/client']
};

exports.files =  {
  javascripts: {
    joinTo: {
      'js/admin.js': /^app\/client\/admin/,
      'js/habillage.js': /^app\/client\/habillage/,
      'js/wall.js': /^app\/client\/wall/
    }
  },
  stylesheets: {
    joinTo: {
      'css/admin.css': /^app\/styles\/admin.styl$/,
      'css/habillage.css': /^app\/styles\/habillage.styl$/,
      'css/wall.css': /^app\/styles\/wall.styl$/,
    }
  }
};

exports.modules = {
  nameCleaner: function(path) {
    return path.replace(/^app\/client\//, '');
  }
};

exports.plugins = {
  babel: {presets: ['@babel/preset-env']}
};