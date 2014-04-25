Strap Pebble SDK Quick Start Guide

Getting started with the Strap SDK for Pebble is a pretty straightforward task. Currently, we support the Pebble Javascript SDK, version 2.0 and higher. Strap utilizes AppMessage to communicate between the watch and the connected phone, and tries to be smart about how often it sends data in order to preserve battery life. Note: Strap will not run if the watch battery reports less than 10% life.

---
1: Login to the Strap Dashboard (or create an account), and create an App. You'll need your App ID handy for the next step.

2: Paste the JS code into your pebble-app.js. This step is important, because without it the Strap code on the device can't communicate with the Strap API. This step has two parts:

- a: Paste the initialization code at the top of your Javascript file. 

[[ insert initialization code here ]] 

- b: Then, paste the Strap AppMessage handler in your AppMessage event listener. Be sure to insert your App ID in this step!

[[ insert AppMessage handler ]]

3: Include the Strap C source in your src directory. We typically lean towards a directory structure that looks like this:

- /pebble-app
- - /src
- - - / js
- - - - pebble-js-app.js (put Strap JS code in here)
- - - / strap (the Strap C source)
- - - - strap.c
- - - - strap.h
- - - pebble-app.c

4: Include strap.h in any of your source that contains actions you want to track in Strap. Make sure you correct the path relative to your source.

#include "strap/strap.h"

5: Initialize Strap in your Pebble code

In a typical Pebble pattern, your main() calls an init() and deinit() function. Here, you'll need to include the strap_init() and strap_deinit() functions, respectively.

static void init(void) {
  
  window = window_create();
  window_set_click_config_provider(window, click_config_provider);
  window_set_window_handlers(window, (WindowHandlers) {
    .load = window_load,
    .unload = window_unload,
  });
  const bool animated = true;
  window_stack_push(window, animated);
  
  app_message_register_inbox_received(in_received_handler);
  
  int in_size = app_message_inbox_size_maximum();
  int out_size = app_message_outbox_size_maximum();
  app_message_open(in_size, out_size);

  // initialize strap
  strap_init();
}

static void deinit(void) {
	// unload strap
 	strap_deinit();
  
  window_destroy(window);
}

int main(void) {
  init();
  app_event_loop();
  deinit();
}

6: Start tracking actions! PERHAPS INSERT MORE EXAMPLES HERE TO DRIVE THEM TO INCREASE THEIR ACTIONS AND OUR ABILITY TO MONETIZE. 

static void select_button_click_handler(ClickRecognizerRef recognizer, void *context) {
	// do something on your Pebble
 	strap_log_action("/select");
}

That's it! Accelerometer data is automatically sent in the background periodically and crunched on the server every few hours. If you have issues or problems, please open an issue 