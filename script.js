class JoystickElement {
  constructor(selector) {
    this.element = document.querySelector(selector);
    this.rect = this.calculateRect();
    this.current = this.original;

    // Recalculate the rect on resizing
    window.onresize = () => {
      this.rect = this.calculateRect();
    };
  }

  get original() {
    return {
      vector: {
        x: 0,
        y: 0 },

      angle: 0,
      percentage: 0 };

  }

  calculateRect() {
    let rect = this.element.getBoundingClientRect();

    return Object.assign(
    rect,
    {
      center: {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2 },

      radius: rect.width / 2 // Improve this
    });

  }}


class JoystickShaft extends JoystickElement {
  clamp(x, y, boundary) {
    // Trigonometry time!
    // - Who says what you learn in school won't become useful :D
    let diff = {
      x: x - this.rect.center.x,
      y: y - this.rect.center.y };


    // Get the distance between the cursor and the center
    let distance = Math.sqrt(
    Math.pow(diff.x, 2) + Math.pow(diff.y, 2));


    // Get the angle of the line
    let angle = Math.atan2(diff.x, diff.y);
    // Convert into degrees!
    this.current.angle = 180 - angle * 180 / Math.PI;

    // If the cursor is distance from the center is
    // less than the boundary, then return the diff
    //
    // Note: Boundary = radius
    if (distance < boundary) {
      this.current.percentage = distance / boundary * 100;
      return this.current.vector = diff;
    }

    // If it's a longer distance, clamp it!
    this.current.percentage = 100;

    return this.current.vector = {
      x: Math.sin(angle) * boundary,
      y: Math.cos(angle) * boundary };

  }

  move(from, to, duration, callback) {
    Velocity(
    this.element,
    {
      translateX: [to.x, from.x],
      translateY: [to.y, from.y],
      translateZ: 0 },

    {
      duration: duration,
      queue: false,
      complete() {
        if (typeof callback === 'function') {
          callback();
        }
      } });


  }}


class Joystick {
  constructor(base, shaft) {
    this.state = 'inactive';
    this.base = new JoystickElement(base);
    this.shaft = new JoystickShaft(shaft);
    this.boundary = this.base.rect.radius * 0.75;

    this.onactivate = function () {};
    this.ondeactivate = function () {};
    this.ondrag = function () {};

    this.activate = this.activate.bind(this);
    this.deactivate = this.deactivate.bind(this);
    this.drag = this.drag.bind(this);
  }

  static get ANIMATION_TIME() {
    return 25;
  }

  attachEvents() {
    this.base.element.addEventListener('pointerdown', this.activate, false);
    document.addEventListener('pointerup', this.deactivate, false);
    document.addEventListener('pointermove', this.drag, false);

    return this;
  }

  detachEvents() {
    this.base.element.removeEventListener('pointerdown', this.activate, false);
    document.removeEventListener('pointerup', this.deactivate, false);
    document.removeEventListener('pointermove', this.drag, false);

    this.deactivate();

    return this;
  }

  activate() {
    this.state = 'active';
    this.base.element.classList.add('active');

    if (typeof this.onactivate === 'function') {
      this.onactivate();
    }

    return this;
  }

  deactivate() {
    this.state = 'inactive';
    this.base.element.classList.remove('active');

    this.shaft.move(
    this.shaft.current.vector,
    this.shaft.original.vector,
    this.constructor.ANIMATION_TIME,
    () => {
      console.log('Velocity:',this.constructor.ANIMATION_TIME);
      this.shaft.element.removeAttribute('style');
      this.shaft.current = this.shaft.original;

      if (typeof this.ondeactivate === 'function') {
        this.ondeactivate();
      }
    });


    return this;
  }

  drag(e) {
    if (this.state !== 'active') {
      return this;
    }

    this.shaft.move(
    this.shaft.original.vector,
    this.shaft.clamp(e.clientX, e.clientY, this.boundary),
    0,
    () => {
      console.log('this.shaft.original.vector:',this.shaft.original.vector);
      if (typeof this.ondrag === 'function') {
        this.ondrag();
      }
    });


    return this;
  }}


// Setup the Joystick
const joystick = new Joystick('.joystick-base', '.joystick-shaft');
var cmd = [0,0.1,0,0,true]
// Attach the events for the joystick
// Can also detach events with the detachEvents function
joystick.attachEvents();

// Lets animate the background colour around using hsl to show the degree of control this has!
// Puns are funny.
joystick.ondeactivate = function () {
  document.body.removeAttribute('style');
  if (!cmd[4]) {
    console.log("Robô parado")
    cmd = [0,0.1,0,0,true]
    enviarMsgForServer("STOP")
  }
};

joystick.ondrag = function () {
  if (this.shaft.current.angle > cmd[0] && this.shaft.current.angle <= cmd[1]) {
    return
  }
  if (this.shaft.current.angle >= cmd[2] && this.shaft.current.angle < cmd[3]) {
    return
  }
  if (this.shaft.current.angle > 340 && this.shaft.current.angle <= 360 || this.shaft.current.angle >= 0 && this.shaft.current.angle <= 25) {
    cmd = [340,360,0,25,false]
    console.log("FRENTE");
    enviarMsgForServer("Y")
  }
  if (this.shaft.current.angle > 25 && this.shaft.current.angle <= 70) {
    cmd = [25,70,0,0,false]
    console.log("NORDESTE");
    enviarMsgForServer("NORDESTE")
  }
  if (this.shaft.current.angle > 70 && this.shaft.current.angle <= 115) {
    cmd = [70,115,0,0,false]
    console.log("DIREITA");
    enviarMsgForServer("X")
  }
  if (this.shaft.current.angle > 115 && this.shaft.current.angle <= 160) {
    cmd = [115,160,0,0,false]
    console.log("SUDESTE");
    enviarMsgForServer("SUDESTE")
  }
  if (this.shaft.current.angle > 160 && this.shaft.current.angle <= 205) {
    cmd = [160,205,0,0,false]
    console.log("TRÁS");
    enviarMsgForServer("A")
  }
  if (this.shaft.current.angle > 205 && this.shaft.current.angle <= 250) {
    cmd = [205,250,0,0,false]
    console.log("SUDOESTE");
    enviarMsgForServer("SUDOESTE")
  }
  if (this.shaft.current.angle > 250 && this.shaft.current.angle <= 295) {
    cmd = [250,295,0,0,false]
    console.log("ESQUERDA");
    enviarMsgForServer("B")
  }
  if (this.shaft.current.angle > 295 && this.shaft.current.angle <= 340) {
    cmd = [295,340,0,0,false]
    console.log("NOROESTE");
    enviarMsgForServer("NOROESTE")
  }
};