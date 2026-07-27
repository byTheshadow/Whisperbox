
#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use tauri::{
    CustomMenuItem, Manager, SystemTray, SystemTrayEvent, SystemTrayMenu, WindowEvent,
};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;

fn main() {
    let tray_menu = SystemTrayMenu::new()
        .add_item(CustomMenuItem::new("show", "唤醒 Whisperbox"))
        .add_item(CustomMenuItem::new("quit", "深渊沉睡 (退出)"));

    let system_tray = SystemTray::new().with_menu(tray_menu);

    // 标记应用是否应该继续运行后台任务
    let running = Arc::new(AtomicBool::new(true));
    let running_clone = running.clone();

    tauri::Builder::default()
        .system_tray(system_tray)
        .on_system_tray_event(|app, event| match event {
            SystemTrayEvent::MenuItemClick { id, .. } => match id.as_str() {
                "show" => {
                    if let Some(window) = app.get_window("main") {
                        let _ = window.show();
                        let _ = window.set_focus();
                    }
                }
                "quit" => {
                    std::process::exit(0);
                }
                _ => {}
            },
            SystemTrayEvent::DoubleClick { .. } => {
                if let Some(window) = app.get_window("main") {
                    let _ = window.show();
                    let _ = window.set_focus();
                }
            }
            _ => {}
        })
        .on_window_event(|event| {
            // 拦截关闭按钮，改为隐藏窗口（后台保活）
            if let WindowEvent::CloseRequested { api, .. } = event.event() {
                event.window().hide().unwrap_or_default();
                api.prevent_close();
            }
        })
        .setup(move |app| {
            let app_handle = app.handle();

            // 后台守护线程：定时检测并触发主动推送
            std::thread::spawn(move || {
                while running_clone.load(Ordering::Relaxed) {
                    std::thread::sleep(std::time::Duration::from_secs(60));

                    // 向前端发送心跳事件，前端可据此判断是否需要触发主动传讯
                    let _ = app_handle.emit_all("backend-heartbeat", ());

                    // 未来在这里添加：
                    // 1. 检查 Todo 到期时间 → 发系统通知
                    // 2. 计算距离上次对话时间 → 触发 AI 主动消息
                    // 3. 系统唤醒后的时间补偿逻辑
                }
            });

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("启动 Whisperbox 时发生错误");
}
