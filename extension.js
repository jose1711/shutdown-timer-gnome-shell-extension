// UI stuff
const St = imports.gi.St;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;
const Main = imports.ui.main;
const Mainloop = imports.mainloop;
const Gio = imports.gi.Gio;
const Gtk = imports.gi.Gtk;
const Gir = imports.gi.GIRepository;
const Lang = imports.lang;
// shutdown functionality
const GnomeSession = imports.misc.gnomeSession;
//settings
const Extension = imports.misc.extensionUtils.getCurrentExtension();
const Convenience = Extension.imports.convenience;
const Util = imports.misc.util;
const GLib = imports.gi.GLib;


let shutdownTimerButton, settings, time, h, m, s;

const ShutdownTimerButton = new Lang.Class({
  Name: 'ShutdownTimerButton',
  Extends: PanelMenu.Button,
  time: null,

   _init: function ()
   {
     this.parent(0.0, "Automatic Shutdown Timer");

     this.button = new St.BoxLayout({ style_class: 'panel-button' });
     this.icon = new St.Icon({ icon_name: 'org.gnome.clocks-symbolic',
                             style_class: 'system-status-icon' });
     this.time = new St.Label({ text: "00:00:00",
                              style_class: 'timeLabel' });

     this.button.add_child(this.icon);
     this.button.add_child(this.time);

     this.actor.add_actor(this.button);

     this._buildMenu();
  },

  _buildMenu: function () {

      // Create menu section for items
      this.popupMenu = new PopupMenu.PopupMenuSection();

      this.scrollViewMenuSection = new PopupMenu.PopupMenuSection();
      let scrollView = new St.ScrollView();

      scrollView.add_actor(this.popupMenu.actor);

      this.scrollViewMenuSection.actor.add_actor(scrollView);

      this.menu.addMenuItem(this.scrollViewMenuSection);

      // Add separator
      this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
      // First Item
      let newTimer = new PopupMenu.PopupMenuItem('New Timer');
      this.popupMenu.addMenuItem(newTimer, 0);
      // Second Item
      this.pauseTimer = new PopupMenu.PopupMenuItem('Pause/Resume Timer');
      this.popupMenu.addMenuItem(this.pauseTimer, 1);

      newTimer.connect('activate', Lang.bind(this, this._openSettings));
    },

    _openSettings: function () {
      global.log('how about no')
      Util.spawn([
          "gnome-shell-extension-prefs",
          Extension.metadata.uuid
      ]);
    },
});
//ShutdownTimerButton

// get values from settings
function onTimeUpdate(){
  h = settings.get_int('hours-value');
  m = settings.get_int('minutes-value');
  s = settings.get_int('seconds-value');
  time = (h*3600 + m*60 + s);
  render_time()
}

function start(){
  if (!time) {
    onTimeUpdate()
  }
  global.log('shutdown in ' + time.toString());
  GLib.timeout_add_seconds(GLib.PRIORITY_DEFAULT , 1,  render_time);
}

function render_time(){
  if (time === 0) {
    global.log('END');
    shutdown();
    return false;
  }
  if (s === 0) {
    if (m === 0) {
      h = h - 1;
      m = 59;
    }
    else {
      m = m - 1;
    }
    s = 60;
  }
  s = s - 1;
  time = time - 1;
  let H,M,S;
  H = h.toString();
  M = m.toString();
  S = s.toString();
  H = H.length === 1 ? '0' + H : H;
  M = M.length === 1 ? '0' + M : M;
  S = S.length === 1 ? '0' + S : S;
  shutdownTimerButton.time.text = H + ":" + M + ":" + S;
  return true;
}

function shutdown(){
  global.log('lel')
  Main.overview.hide();
	let session = new GnomeSession.SessionManager();
	session.ShutdownRemote(0);
}

function init()
{
  settings = Convenience.getSettings();
}

function enable()
{
  shutdownTimerButton = new ShutdownTimerButton();
  Main.panel.addToStatusArea('shutdown-timer-button', shutdownTimerButton);

  settings.connect('changed::seconds-value', onTimeUpdate);
	settings.connect('changed::hours-value', onTimeUpdate);
	settings.connect('changed::minutes-value', onTimeUpdate);
  settings.connect('changed::timer-start', start);
}

function disable()
{
  shutdownTimerButton.destroy()
}
