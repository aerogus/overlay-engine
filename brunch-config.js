exports.config = {
  paths: {
    watched: ['app/assets', 'app/styles', 'app/views', 'app/client']
  },
  files: {
    stylesheets: {
      joinTo: {
        'css/habillage.min.css': /^app\/styles\/habillage.styl$/,
        'css/admin.min.css': /^app\/styles\/admin.styl$/
      }
    },
    javascripts: {
      joinTo: {
        'js/habillage.min.js': /^app\/client\/habillage/,
        'js/admin.min.js': /^app\/client\/admin/
      }
    }
  },
  modules: {
    nameCleaner: function(path) {
      return path.replace(/^app\/client\//, '');
    }
  },
  plugins: {
    postcss: {
      processors: [require('postcss-assets'), require('autoprefixer')(['last 3 versions'])]
    }
  }
};