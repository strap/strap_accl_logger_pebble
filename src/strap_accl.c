#include <pebble.h>
#include "strap/strap.h"

static Window *window;
static TextLayer *text_layer;

#define TupletStaticCString(_key, _cstring, _length) \
((const Tuplet) { .type = TUPLE_CSTRING, .key = _key, .cstring = { .data = _cstring, .length = _length + 1 }})

#define MAX_NUM_MENU_ITEMS 32
#define MAX_NAME_LEN 24
#define NUM_MENU_ITEMS 3
static SimpleMenuItem menu_items[MAX_NUM_MENU_ITEMS];
static SimpleMenuSection menu_sections[1];
static SimpleMenuLayer *simple_menu_layer;

#define CONFIG_MESSAGE 20

static int cur_started_menu = -1;
static int num_menu_items = 0;
static int update_menus_called = 0;

static char menu_item_names[MAX_NUM_MENU_ITEMS][MAX_NAME_LEN]; 
static char menu_item_keys[MAX_NUM_MENU_ITEMS][MAX_NAME_LEN]; 

    
static void load_menus(char* conf){
    char* buf = malloc(2000);
    strncpy(buf, conf, 2000);
    int buf_len = strlen(buf);
    int count = 0;

    num_menu_items = 0;
    char* cval = buf;
    char* cval_start = buf;
    int i = 0;
    
    for(i = 0; i < MAX_NUM_MENU_ITEMS; i++) {
        if(cval == NULL) {
            break;
        }
        // find comma
        while(*cval != ',' && *cval != 0) {
            cval++;
            count++;
        }
        *cval = 0;  // null out comma
        
        strncpy(menu_item_keys[i], cval_start, MAX_NAME_LEN);
        
        cval_start = ++cval;
        count++;
        if(count >= buf_len) {
            break;
        }
        
        // find comma
        while(*cval != ',' && *cval != 0) {
            cval++;
            count++;
        }
        *cval = 0;  // null out comma
        
        strncpy(menu_item_names[i], cval_start, MAX_NAME_LEN);
        num_menu_items++;
        
        cval_start = ++cval;
        count++;
        if(count >= buf_len) {
            break;
        }
    } 
    free(buf);
}

static void menu_select_callback(int index, void *ctx) {
  
  if(cur_started_menu == index) {
    // stop logging this menu value
    menu_items[index].subtitle = "";
    cur_started_menu = -1;
    strap_set_activity("UNKNOWN");
    strap_log_action(menu_item_keys[cur_started_menu]);
  }
  else {
    if( cur_started_menu != -1){
        // stop logging prev menu value
        menu_items[cur_started_menu].subtitle = "";
        cur_started_menu = -1;
        strap_set_activity("UNKNOWN");
    }
    cur_started_menu = index;
    menu_items[cur_started_menu].subtitle = "Logging";
    strap_set_activity(menu_item_keys[cur_started_menu]);
    strap_log_action(menu_item_keys[cur_started_menu]);
  }
   
  // Mark the layer to be updated
  layer_mark_dirty(simple_menu_layer_get_layer(simple_menu_layer));
}

static void update_menus() {
  
  if(update_menus_called) {
    // destroy previous layer
    layer_remove_from_parent(simple_menu_layer_get_layer(simple_menu_layer));
    simple_menu_layer_destroy(simple_menu_layer);
    cur_started_menu = -1;
    strap_set_activity("UNKNOWN");
  }
  else {
    update_menus_called = 1;
  }
  
  for(int i = 0; i < num_menu_items; i++) {
  
      menu_items[i].title = menu_item_names[i];
      menu_items[i].callback = menu_select_callback;
      menu_items[i].subtitle = "";
  
  }
  
  
  menu_sections[0].num_items = num_menu_items;
  menu_sections[0].items = menu_items;
  
  // Now we prepare to initialize the simple menu layer
  // We need the bounds to specify the simple menu layer's viewport size
  // In this case, it'll be the same as the window's
  Layer *window_layer = window_get_root_layer(window);
  GRect bounds = layer_get_frame(window_layer);

  // Initialize the simple menu layer
  simple_menu_layer = simple_menu_layer_create(bounds, window, menu_sections, 1, NULL);

  // Add it to the window for display
  layer_add_child(window_layer, simple_menu_layer_get_layer(simple_menu_layer));
}

static void in_received_handler(DictionaryIterator *iter, void *context)
{
    Tuple* t = dict_read_first(iter);
    while(t != NULL) {
        switch(t->key) {
            case CONFIG_MESSAGE:
                //strtok(t->value->cstring,",");
                load_menus(t->value->cstring);
                update_menus();
                break;
        }
        t = dict_read_next(iter);
    }
}

static void select_click_handler(ClickRecognizerRef recognizer, void *context) {
  text_layer_set_text(text_layer, "Select");
}

static void up_click_handler(ClickRecognizerRef recognizer, void *context) {
  text_layer_set_text(text_layer, "Up");
}

static void down_click_handler(ClickRecognizerRef recognizer, void *context) {
  text_layer_set_text(text_layer, "Down");
}



static void click_config_provider(void *context) {
  window_single_click_subscribe(BUTTON_ID_SELECT, select_click_handler);
  window_single_click_subscribe(BUTTON_ID_UP, up_click_handler);
  window_single_click_subscribe(BUTTON_ID_DOWN, down_click_handler);
}



static void window_load(Window *window) {
    
}

static void window_unload(Window *window) {
  text_layer_destroy(text_layer);
  simple_menu_layer_destroy(simple_menu_layer);
}

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
  strap_init();
}

static void deinit(void) {
  strap_deinit();
  
  window_destroy(window);
}

int main(void) {
  init();
  app_event_loop();
  deinit();
}
