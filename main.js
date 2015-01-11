/*jslint vars: true, plusplus: true, devel: true, nomen: true, regexp: true, indent: 4, maxerr: 50 */
/*global define, $, brackets, window */

define(function (require, exports, module) {
  "use strict";

  // Brackets modules
  var AppInit            = brackets.getModule("utils/AppInit"),
      NativeApp          = brackets.getModule("utils/NativeApp"),
      Dialogs            = brackets.getModule("widgets/Dialogs"),
      DocumentManager    = brackets.getModule("document/DocumentManager"),
      EditorManager      = brackets.getModule("editor/EditorManager"),
      ExtensionUtils     = brackets.getModule("utils/ExtensionUtils"),
      FileUtils          = brackets.getModule("file/FileUtils"),
      FileSystem         = brackets.getModule("filesystem/FileSystem"),
      FileTreeView       = brackets.getModule("project/FileTreeView"),
      FileTreeViewModel  = brackets.getModule("project/FileTreeViewModel"),
      MainViewManager    = brackets.getModule("view/MainViewManager"),
      PopUpManager       = brackets.getModule("widgets/PopUpManager"),
      PreferencesManager = brackets.getModule("preferences/PreferencesManager"),
      ProjectManager     = brackets.getModule("project/ProjectManager"),
      StringUtils        = brackets.getModule("utils/StringUtils"),
      WorkspaceManager   = brackets.getModule("view/WorkspaceManager");

  // Templates
  var settingsTemplate = require("text!templates/settings.html");

  // Local modules
  // none yet

  // jQuery objects
  var $dialog,
      $icon;

  // Other vars
  var dialog;
  var JsFilesToHide = [];

  // Prefs
  var _prefs = PreferencesManager.getExtensionPrefs("better-coffee");
  _prefs.definePreference("hideJsFiles", "boolean", true);

  // Settings button click
  var _showSettings = function() {
    dialog = Dialogs.showModalDialogUsingTemplate(settingsTemplate);
    $dialog = dialog.getElement();

    $dialog.find("#hideJsFiles")
    .prop("checked", _prefs.get("hideJsFiles") ? 1 : 0)
    .change(function (e) {
      _prefs.set("hideJsFiles", e.target.checked);
      _updateJsFilesShowing();
    });
  };

  // Update js files showing
  var _updateJsFilesShowing = function() {
    if(_prefs.get('hideJsFiles'))
      _findJsFilesToHide();
    else {
      JsFilesToHide = [];
      ProjectManager.rerenderTree();
    }
  }

  // Find js files to hide & rerender filetreeview
  var _findJsFilesToHide = function() {
    var coffeeFiles = [];

    ProjectManager.getAllFiles(function(elt) {
      var ext = FileUtils.getSmartFileExtension(elt._path);
      return ext === 'js' || ext === 'coffee';
    }).done(function(fileList) {
      // extract coffee filepaths
      fileList.forEach(function(elt) {
        if (FileUtils.getSmartFileExtension(elt._path) === 'coffee')
          coffeeFiles.push(elt._path);
      });

      JsFilesToHide = [];
      // for each js file, check if there is a coffee file matching
      fileList.forEach(function(elt) {
        if (FileUtils.getSmartFileExtension(elt._path) === 'js')
          if (coffeeFiles.indexOf(FileUtils.getFilenameWithoutExtension(elt._path) + '.coffee') !== -1) {
            JsFilesToHide.push(elt._path);
          }
      });

      // now that JsFilesToHide is ready, rerender
      ProjectManager.rerenderTree();
    });
  }

  // Load custom CSS
  ExtensionUtils.loadStyleSheet(module, "styles/BetterCoffee.css");

  // Add toolbar icon
  $icon = $("<a>")
  .attr({
    id: "better-coffee-icon",
    href: "#"
  })
  .click(_showSettings)
  .appendTo($("#main-toolbar .buttons"));

  // The magic !
  FileTreeView.addClassesProvider(function(item) {
    if (JsFilesToHide.indexOf(item.fullPath) !== -1) {
      return 'js-to-hide';
    }
  });

  // Project change events
  ProjectManager.on("projectOpen", function () {
    _updateJsFilesShowing();

    /*FileSystem.on("change", function() {
      _updateJsFilesShowing();
    });*/
  });

  ProjectManager.on("projectRefresh", function () {
    _updateJsFilesShowing();
  });

  $(ProjectManager).on("projectClose", function () {

  });
});
