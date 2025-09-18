use jsbind::prelude::*;
use webbind::*;

wit_bindgen::generate!({inline: "
package my:app@0.1.0;

world app {
}
"});

struct App;

impl wasip2::exports::cli::run::Guest for App {
    fn run() -> Result<(), ()> {
        emlite::init();
        let con = Console::get();
        let document = window().document();
        let bodies = document.get_elements_by_tag_name(&"body".into());
        if bodies.length() == 0 {
            con.log(&["I Ain't got Nobody!".into()]);
            return Err(());
        }
        let body = bodies.item(0);
        let mut button = document
            .create_element(&"BUTTON".into())
            .dyn_into::<HTMLButtonElement>()
            .unwrap();

        let style = button.style();
        style.set_property(&"color".into(), &"red".into());
        style.set_property(&"background-color".into(), &"#aaf".into());
        style.set_property(&"border".into(), &"solid".into());

        button.set_text_content(&"Click me".into());
        button.add_event_listener(
            // or &JsString::from("click"),
            &"click".into(),
            &EventListener::from_closure(move |p: Event| {
                con.log(&[p.dyn_into::<PointerEvent>().unwrap().client_x().into()]);
                Undefined::VALUE
            }),
        );
        body.append_child(button.dyn_ref::<Node>().unwrap());
        Ok(())
    }
}

wasip2::cli::command::export!(App);