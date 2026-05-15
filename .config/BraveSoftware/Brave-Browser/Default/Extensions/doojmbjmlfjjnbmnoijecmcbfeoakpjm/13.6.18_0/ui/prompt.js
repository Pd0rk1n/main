



















(async () => {
  let data = await Messages.send("getPromptData");
  debug("Prompt data", data);
  if (!data) {
    error("Missing promptData");
    window.close();
    return;
  }

  let done = async () => {
    await Messages.send("promptDone", data);
    done = () => {};
    if ("windows" in browser) {
      try {
        await browser.windows.remove((await browser.windows.getCurrent()).id);
      } catch (e) {
        console.error(e);
      }
    }
    window.close();
  }

  let {title, message, options, checks, buttons} = data.features;

  function labelFor(el, text) {
    let label = document.createElement("label");
    label.setAttribute("for", el.id);
    label.textContent = text;
    return label;
  }

  function createInput(container, {label, type, name, checked}, count) {
    let input = document.createElement("input");
    input.type = type;
    input.value = count;
    input.name = name;
    input.checked = checked;
    input.id = `${name}-${count}`;
    let sub = document.createElement("div");
    sub.appendChild(input);
    sub.appendChild(labelFor(input, label));
    container.appendChild(sub);
  }

  function createButton(container, label, count) {
    let button = document.createElement("button");
    if (count === 0) button.type = "submit";
    button.id = `${button}-${count}`;
    button.value = count;
    button.textContent = label;
    container.appendChild(button);
  }

  function renderInputs(container, dataset, type, name) {
    if (typeof container === "string") {
      container = document.querySelector(container);
    }
    if (typeof dataset === "string") {
      container.innerHTML = dataset;
      return;
    }
    container.innerHTML = "";
    let count = 0;
    if (dataset && dataset[Symbol.iterator]) {
      let create = type === "button" ? createButton : createInput;
      for (let data of dataset) {
        data.type = type;
        data.name = name;
        create(container, data, count++);
      }
    }
  }
  if (title) {
    document.title = title;
    document.querySelector("#title").textContent = title;
  }
  if (message) {
    let lines = message.split(/\n/);
    let container = document.querySelector("#message");
    container.classList.toggle("multiline", lines.length > 1);
    message.innerHTML = "";
    for (let l of lines) {
      let p = document.createElement("p");
      p.textContent = l;
      container.appendChild(p);
    }
  }
  renderInputs("#options", options, "radio", "opt");
  renderInputs("#checks", checks, "checkbox", "flag");
  renderInputs("#buttons", buttons, "button", "button");
  addEventListener("hide", e => {
    done();
  });

  let buttonClicked = e => {
    let {result} = data;
    result.button = parseInt(e.currentTarget.value);
    let option = document.querySelector('#options [type="radio"]:checked');
    result.option = option && parseInt(option.value);
    result.checks = [...document.querySelectorAll('#checks [type="checkbox"]:checked')]
      .map(c => parseInt(c.value));
    done();
  };
  for (let b of document.querySelectorAll("#buttons button")) {
    b.addEventListener("click", buttonClicked);
  }

  addEventListener("keydown", e => {
    if (e.ctrlKey || e.metaKey || e.shiftKey) return;
    switch(e.code) {
      case "Escape":
        window.close();
        return;
      case "Enter":
        let defButton = document.querySelector("#buttons button[type=submit]");
        if (defButton) defButton.click();
        return;
    }
  });

  let fitHeight = async e => {
    if (!("windows" in browser)) {

      document.querySelector("#buttons").scrollIntoView();
      return;
    }
    let win = await browser.windows.getCurrent();
    let delta = document.documentElement.offsetHeight - window.innerHeight;
    for (let attempts = 2; attempts-- > 0;) {
      await browser.windows.update(win.id, {
        height: win.height + delta,
        top: win.top - Math.round(delta / 2),
      });
    }
  }
  if (document.readyState === "complete") {
    fitHeight();
  } else {
    window.addEventListener("load", fitHeight);
  }
})();
