



















UI.toolbarInit = () => {
  if (UI.toolbarInit.done || UI.highContrast || UI.local.highContrast)
    return;
  UI.toolbarInit.done = true;
  let toolbar = document.getElementById("top");
  let spacer = toolbar.querySelector(".spacer");
  let hider = toolbar.querySelector(".hider");

  if (UI.local.toolbarLayout) {
    let {left, right, hidden} = UI.local.toolbarLayout;
    for (let id of left) {
      toolbar.insertBefore(document.getElementById(id), hider);
    }
    for (let id of right) {
      toolbar.appendChild(document.getElementById(id));
    }
    for (let id of hidden) {
      hider.appendChild(document.getElementById(id));
    }
  }

  let makeDraggable = b => {

    let wrapper = document.createElement("div");
    b.replaceWith(wrapper);

    b.innerHTML = "<div></div>";
    wrapper.appendChild(b);
    b = wrapper;
    b.setAttribute("draggable", "true");
  }

  let toggleHider = b => {
    let cl = hider.classList;
    cl.toggle("open", b);
    cl.toggle("empty", !hider.querySelector(".icon"));
  }
  hider.querySelector(".hider-close").onclick = e => {
    toggleHider(false);
  };

  toggleHider(false);

  let dnd = {
    dragstart(ev) {
      if (hider.querySelectorAll(".icon").length) {
        toggleHider(true);
      }
      let button = ev.target.querySelector(".icon");
      if (!button) {
        ev.preventDefault();
        return;
      }


      let placeHolder = document.createElement("div");
      let {style} = placeHolder;
      style.backgroundImage = getComputedStyle(button).backgroundImage;
      style.backgroundSize = "contain";
      let width = button.offsetWidth * 1.2;
      let height = button.offsetHeight * 1.2;
      style.width =`${width}px`;
      style.height = `${height}px`
      style.position = "absolute";
      style.top = "-2000px";
      toolbar.appendChild(placeHolder);
      setTimeout(() => placeHolder.remove(), 0);

      let dt = ev.dataTransfer;
      dt.setData("text/plain", button.id);
      dt.dropEffect = "move";

      dt.setDragImage(placeHolder, width / 2, height / 2);

      toggleHider(true);
      this.draggedElement = ev.target; 
      this.draggedElement.classList.add("drag");
    },
    dragend(ev)  {
      this.draggedElement.classList.remove("drag");
      this.draggedElement = null;
    },
    dragover(ev) {
      ev.preventDefault();
    },
    dragenter(ev) {
    },
    dragleave(ev) {
    },
    drop(ev) {
      let t = ev.target;
      let d = this.draggedElement;
      if (!d) return;

      switch(t) {
        case hider:
          t.appendChild(d);
          break;
        default:
          if (!t.closest("#top")) return; 
          let stop = null;
          for (let c of toolbar.children) {
            if (ev.clientX < c.offsetLeft + c.offsetWidth / 2) {
              stop = c;
              break;
            }
          }
          toolbar.insertBefore(d, stop);
      }

      let left = [], right = [];
      let side = left;
      for (let el of toolbar.querySelectorAll(":scope > .spacer, :scope > [draggable] > .icon")) {
        if (el === spacer) {
          side = right;
        } else {
          side.push(el.id);
        }
      }
      UI.local.toolbarLayout = {
        left, right,
        hidden: Array.from(toolbar.querySelectorAll(".hider .icon")).map(el => el.id),
      };

      debug("%o", UI.local);
      UI.updateSettings({ local: UI.local });
    },

    click(ev) {
      let el = ev.target;
      if (el === spacer || el.classList.contains("reveal")) {
        toggleHider(true);
      }
    }

};


  for (let [action, handler] of Object.entries(dnd)) {
    toolbar.addEventListener(action, handler, true);
  }

  for (let b of toolbar.querySelectorAll(".icon")) {
    makeDraggable(b);
  }
}
