use tauri::{
    menu::{Menu, MenuItem, PredefinedMenuItem, Submenu},
    Emitter,
};

pub fn create_menu(app: &tauri::App) -> Result<Menu<tauri::Wry>, tauri::Error> {
    let settings_item =
        MenuItem::with_id(app, "settings", "Settings...", true, Some("CmdOrCtrl+,"))?;

    let app_submenu = Submenu::with_items(
        app,
        "mboxviewer",
        true,
        &[
            &PredefinedMenuItem::about(app, Some("About MBOX Viewer"), None)?,
            &PredefinedMenuItem::separator(app)?,
            &settings_item,
            &PredefinedMenuItem::separator(app)?,
            &PredefinedMenuItem::services(app, None)?,
            &PredefinedMenuItem::separator(app)?,
            &PredefinedMenuItem::hide(app, None)?,
            &PredefinedMenuItem::hide_others(app, None)?,
            &PredefinedMenuItem::show_all(app, None)?,
            &PredefinedMenuItem::separator(app)?,
            &PredefinedMenuItem::quit(app, None)?,
        ],
    )?;

    let file_submenu = Submenu::with_items(
        app,
        "File",
        true,
        &[&PredefinedMenuItem::close_window(app, None)?],
    )?;

    let edit_submenu = Submenu::with_items(
        app,
        "Edit",
        true,
        &[
            &PredefinedMenuItem::undo(app, None)?,
            &PredefinedMenuItem::redo(app, None)?,
            &PredefinedMenuItem::separator(app)?,
            &PredefinedMenuItem::cut(app, None)?,
            &PredefinedMenuItem::copy(app, None)?,
            &PredefinedMenuItem::paste(app, None)?,
            &PredefinedMenuItem::select_all(app, None)?,
        ],
    )?;

    let view_submenu = Submenu::with_items(
        app,
        "View",
        true,
        &[&PredefinedMenuItem::fullscreen(app, None)?],
    )?;

    let window_submenu = Submenu::with_items(
        app,
        "Window",
        true,
        &[
            &PredefinedMenuItem::minimize(app, None)?,
            &PredefinedMenuItem::maximize(app, None)?,
            &PredefinedMenuItem::separator(app)?,
            &PredefinedMenuItem::close_window(app, None)?,
        ],
    )?;

    Menu::with_items(
        app,
        &[
            &app_submenu,
            &file_submenu,
            &edit_submenu,
            &view_submenu,
            &window_submenu,
        ],
    )
}

pub fn handle_menu_event(app: &tauri::AppHandle, event: &tauri::menu::MenuEvent) {
    println!("Menu event received: {:?}", event.id());
    if event.id().as_ref() == "settings" {
        println!("Settings menu item clicked, emitting open-preferences event");
        match app.emit("open-preferences", ()) {
            Ok(_) => println!("Event emitted successfully"),
            Err(e) => eprintln!("Failed to emit event: {e:?}"),
        }
    }
}
