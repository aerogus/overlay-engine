exports.optimize = true;

exports.paths = {
  watched: ['app/assets', 'app/styles', 'app/views', 'app/client']
};

exports.files =  {
  javascripts: {
    joinTo: {
      'js/habillage.js': /^app\/client\/habillage/,
      'js/admin.js': /^app\/client\/admin/
    }
  },
  stylesheets: {
    joinTo: {
      'css/habillage.css': /^app\/styles\/habillage.styl$/,
      'css/admin.css': /^app\/styles\/admin.styl$/
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