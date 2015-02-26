#!/usr/bin/gjs

/*
GJS example showing how to build Gtk javascript applications
getting information from GLib and command line

Run it with:
    gjs egInfo.js
*/

const Gio   = imports.gi.Gio;
const GLib  = imports.gi.GLib;
const Gtk   = imports.gi.Gtk;
const Lang  = imports.lang;

// Get application folder and add it into the imports path
function getAppFileInfo() {
    let stack = (new Error()).stack,
        stackLine = stack.split('\n')[1],
        coincidence, path, file;

    if (!stackLine) throw new Error('Could not find current file (1)');

    coincidence = new RegExp('@(.+):\\d+').exec(stackLine);
    if (!coincidence) throw new Error('Could not find current file (2)');

    path = coincidence[1];
    file = Gio.File.new_for_path(path);
    return [file.get_path(), file.get_parent().get_path(), file.get_basename()];
}
const path = getAppFileInfo()[1];
imports.searchPath.push(path);

const App = function () { 

    this.info = {
        desktop: '',
        host: '',
        user: '',
        lang: '',
        home: '',
        installed: '',
        program: '',
        script: '',
        folder: '',
        icon: '',
        dstr: '',
        kernel: ''
    };
};

App.prototype.run = function (ARGV) {

    this.application = new Gtk.Application();
    this.application.connect('activate', Lang.bind(this, this.onActivate));
    this.application.connect('startup', Lang.bind(this, this.onStartup));
    this.application.run([]);
};

App.prototype.onActivate = function () {

    this.window.show_all();
};

App.prototype.onStartup = function() {

    this.buildUI();
    this.getInfo();
};

App.prototype.buildUI = function() {

    this.window = new Gtk.ApplicationWindow({ application: this.application,
                                              title: "Example Info" });
    this.window.set_default_size(400, 400);
    try {
        this.info.icon = '/assets/app-icon.png';
        this.window.set_icon_from_file(path + this.info.icon);
    } catch (err) {
        this.info.icon = 'application-x-executable';
        this.window.set_icon_name(this.info.icon);
    }

    this.label = new Gtk.Label({ label: '' });
    this.window.add(this.label);
};

App.prototype.getInfo = function() {
    
    let file = getAppFileInfo();

    this.info.desktop = GLib.getenv('XDG_CURRENT_DESKTOP');
    this.info.host = GLib.get_host_name();
    this.info.user = GLib.get_user_name();
    this.info.lang = GLib.getenv('LANG');
    this.info.home = GLib.get_home_dir();
    this.info.installed = (file[1].indexOf('./local/share/applications') !== -1);
    this.info.program = GLib.get_prgname();
    this.info.script = file[2];
    this.info.folder = file[1];

    try {
        let [res, out] = GLib.spawn_command_line_sync('lsb_release -d');
        if (res) {
            this.info.dstr = out.toString().split('\n')[0].split(':\t')[1];
        }
    } catch ( e ) {
        this.info.dstr = 'Unknown';
        throw e;
    }

    try {
        let [res, out] = GLib.spawn_command_line_sync('uname -r');
        if (res) {
            this.info.kernel = out.toString();
        }
    } catch ( e ) {
        this.info.kernel = 'Unknown';
        throw e;
    }

    this.setLabel();
};


App.prototype.setLabel = function() {
    
    let text;

    text = '';
    if (this.info.desktop !== '')   text = text + '\nDesktop: ' + this.info.desktop;
    if (this.info.host !== '')      text = text + '\nHost: ' + this.info.host;
    if (this.info.user !== '')      text = text + '\nUser: ' + this.info.user;
    if (this.info.lang !== '')      text = text + '\nLanguage: ' + this.info.lang;
    if (this.info.home !== '')      text = text + '\nHome: ' + this.info.home;
    text = text + '\n';
    if (this.info.installed !== '') text = text + '\nInstalled: ' + this.info.installed;
    if (this.info.program !== '')   text = text + '\nProgram: ' + this.info.program;
    if (this.info.script !== '')    text = text + '\nScript: ' + this.info.script;
    if (this.info.folder !== '')    text = text + '\nFolder: ' + this.info.folder;
    if (this.info.icon !== '')      text = text + '\nIcon: ' + this.info.icon;
    text = text + '\n';
    if (this.info.dstr !== '')      text = text + '\nDistro: ' + this.info.dstr;
    if (this.info.kernel !== '')    text = text + '\nKernel: ' + this.info.kernel;

    this.label.set_text(text);
};

//Run the application
let app = new App();
app.run(ARGV);