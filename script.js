const canvas = document.querySelector('.canvas');
const canvasContext = canvas.getContext('2d');

const fillBucketButton = document.querySelector('.fill-bucket-button');
const chooseColorButton = document.querySelector('.choose-color-button');
const pencilButton = document.querySelector('.pencil-button');
const colorInput = document.querySelector('.color-input');
const currentColorButton = document.querySelector('.current-color-button');
const currentColorCircle = document.querySelector('.current-color');
const previousColorButton = document.querySelector('.previous-color-button');
const previousColorCircle = document.querySelector('.previous-color');
const redColorButton = document.querySelector('.red-color-button');
const blueColorButton = document.querySelector('.blue-color-button');
const warning = document.querySelector('.warning');
const warningText = document.querySelector('.warning__text');

const palette = {

  tools: {
    fillBucket: false,
    chooseColor: false,
    pencil: false,
  },

  currentColor: '#000000',
  previousColor: '#ffffff',

  canvasSize: 512,
  matrixSize: 128,
  get matrixCoefficient() {
    return this.canvasSize / this.matrixSize;
  },

  isDrawing: false,

  xStart: undefined,
  yStart: undefined,

  changeColor(color) {
    palette.previousColor = palette.currentColor;
    palette.currentColor = color;
    colorInput.value = color;
    localStorage.setItem('paletteCurrentColor', palette.currentColor);
    localStorage.setItem('palettePreviousColor', palette.previousColor);
    previousColorCircle.style.background = palette.previousColor;
    currentColorCircle.style.background = palette.currentColor;
  },

  rgba2hex(rgba) {
    const rgb = rgba.match(/^rgba?[\s+]?\([\s+]?(\d+)[\s+]?,[\s+]?(\d+)[\s+]?,[\s+]?(\d+)[\s+]?/i);
    return (rgb && rgb.length === 4) ? `#${
      (`0${parseInt(rgb[1], 10).toString(16)}`).slice(-2)
    }${(`0${parseInt(rgb[2], 10).toString(16)}`).slice(-2)
    }${(`0${parseInt(rgb[3], 10).toString(16)}`).slice(-2)}` : '';
  },

  initButtonColors() {
    palette.currentColor = colorInput.value;
    currentColorCircle.style.background = palette.currentColor;
    previousColorCircle.style.background = palette.previousColor;
    document.querySelector('.pencil-button').click();
  },

  loadFromStorage() {
    palette.currentColor = localStorage.getItem('paletteCurrentColor') || '#000000';
    palette.previousColor = localStorage.getItem('palettePreviousColor') || '#ffffff';
    colorInput.value = localStorage.getItem('paletteCurrentColor');
    currentColorCircle.style.background = palette.currentColor;
    previousColorCircle.style.background = palette.previousColor;
    const btn = localStorage.getItem('paletteButton');
    if (btn === 'fillBucket') {
      document.querySelector('.fill-bucket-button').click();
    } else if (btn === 'chooseColor') {
      document.querySelector('.choose-color-button').click();
    } else if (btn === 'pencil') {
      document.querySelector('.pencil-button').click();
    }

    if ((localStorage.getItem('paletteImageLoaded'))) {
      palette.imageLoaded = true;
    }

    if (localStorage.getItem('paletteMatrixSize')) {
      palette.matrixSize = Number(localStorage.getItem('paletteMatrixSize'));
    }
  },

  fillBucket(event, matrixCoefficient) {
    canvasContext.fillStyle = palette.currentColor;

    const k = matrixCoefficient;

    const pixelImgData = canvasContext.getImageData(event.offsetX, event.offsetY, 1, 1);
    const pixelRgbaColor = JSON.stringify(Array.from(pixelImgData.data));

    const imgData = canvasContext.getImageData(0, 0, canvas.width, canvas.height);
    const canvasColorArr = imgData.data;

    function getPixelColor(x, y) {
      if (x >= 0 && x < canvas.width && y >= 0 && y < canvas.height) {
        const r = (y * canvas.width + x) * 4;
        const g = r + 1;
        const b = g + 1;
        const a = b + 1;
        return [canvasColorArr[r], canvasColorArr[g], canvasColorArr[b], canvasColorArr[a]];
      }
      return false;
    }

    const stack = [];
    const visited = {};

    function checkNeighbours(x, y) {
      const secondNeighbour = getPixelColor(x, y - k);
      const fourthNeighbour = getPixelColor(x - k, y);
      const fifthNeighbour = getPixelColor(x + k, y);
      const seventhNeighbour = getPixelColor(x, y + k);

      if (secondNeighbour) {
        if (JSON.stringify(secondNeighbour) === pixelRgbaColor) {
          const neighbourCoordinates = `[${x},${y - k}]`;
          if (!visited[neighbourCoordinates]) {
            stack.push(neighbourCoordinates);
            visited[neighbourCoordinates] = true;
          }
        }
      }

      if (fourthNeighbour) {
        if (JSON.stringify(fourthNeighbour) === pixelRgbaColor) {
          const neighbourCoordinates = `[${x - k},${y}]`;
          if (!visited[neighbourCoordinates]) {
            stack.push(neighbourCoordinates);
            visited[neighbourCoordinates] = true;
          }
        }
      }

      if (fifthNeighbour) {
        if (JSON.stringify(fifthNeighbour) === pixelRgbaColor) {
          const neighbourCoordinates = `[${x + k},${y}]`;
          if (!visited[neighbourCoordinates]) {
            stack.push(neighbourCoordinates);
            visited[neighbourCoordinates] = true;
          }
        }
      }

      if (seventhNeighbour) {
        if (JSON.stringify(seventhNeighbour) === pixelRgbaColor) {
          const neighbourCoordinates = `[${x},${y + k}]`;
          if (!visited[neighbourCoordinates]) {
            stack.push(neighbourCoordinates);
            visited[neighbourCoordinates] = true;
          }
        }
      }

      canvasContext.fillRect(x, y, k, k);
    }

    function floodFill(x, y) {
      stack.push(JSON.stringify([x, y]));

      while (stack.length) {
        const coordinates = JSON.parse(stack.pop());
        checkNeighbours(coordinates[0], coordinates[1]);
      }
    }

    floodFill(event.offsetX - ((event.offsetX) % k), event.offsetY - ((event.offsetY) % k));
  },

  drawBresenhamLine(xStart, yStart, xEnd, yEnd, matrixCoefficient) {
    canvasContext.fillStyle = palette.currentColor;

    const k = matrixCoefficient;

    function draw(x, y) {
      canvasContext.fillRect(x, y, k, k);
    }

    const bresenDraw = (xFrom, yFrom, xTo, yTo) => {
      let x0 = xFrom;
      let y0 = yFrom;
      const x1 = xTo;
      const y1 = yTo;

      if (x0 === x1 && y0 === y1) {
        draw(x0, y0);
        return;
      }

      const dx = x1 - x0;
      const sx = (dx < 0) ? -1 : 1;
      const dy = y1 - y0;
      const sy = (dy < 0) ? -1 : 1;

      if (Math.abs(dy) < Math.abs(dx)) {
        const m = dy / dx;
        const b = y0 - m * x0;

        while (x0 !== x1) {
          draw(x0, parseInt(Math.round(m * x0 + b), 10));
          x0 += sx * k;
        }
      } else {
        const m = dx / dy;
        const b = x0 - m * y0;

        while (y0 !== y1) {
          draw(parseInt(Math.round(m * y0 + b), 10), y0);
          y0 += sy * k;
        }
      }

      draw(x1, y1);
    };

    bresenDraw(xStart, yStart, xEnd, yEnd);
  },

  saveCanvasState() {
    localStorage.setItem('canvasState', canvas.toDataURL());
  },

  loadCanvasState() {
    const dataURL = localStorage.getItem('canvasState');
    const img = new Image();
    img.src = dataURL;
    img.onload = () => {
      canvasContext.drawImage(img, 0, 0);
    };
  },

  getLinkToImage() {
    // I'm so sorry, I know that this isn't quite good,
    // but this anonymous function is just to show that async/await is used according to the task :)
    (async () => {
      const url = `https://api.unsplash.com/photos/random?query=town,${this.inputValue}&client_id=b92f5f52988366cf4c1e8ec7be7d22faef5dddde306e812fbd18fafa7ff369ec`;

      const response = await fetch(url)
        .then((res) => res.json())
        .then((data) => {
          canvasContext.fillStyle = '#808080';
          canvasContext.fillRect(0, 0, canvas.width, canvas.height);

          const imageObj = new Image();
          imageObj.src = data.urls.small;
          imageObj.crossOrigin = 'anonymous';
          imageObj.onload = () => {
            function resizeImage(imgHeight, imgWidth) {
              let height;
              let width;
              if (imgHeight > imgWidth) {
                height = 512;
                width = Math.round(512 / (imgHeight / imgWidth));
              } else {
                height = Math.round(512 / (imgWidth / imgHeight));
                width = 512;
              }
              return [height, width];
            }

            const heightAndWidth = resizeImage(imageObj.height, imageObj.width);
            const height = heightAndWidth[0];
            const width = heightAndWidth[1];
            const startHeight = Math.round((512 - height) / 2);
            const startWidth = Math.round((512 - width) / 2);
            canvasContext.drawImage(imageObj, startWidth, startHeight, width, height);

            palette.imageLoaded = true;
            localStorage.setItem('paletteImageLoaded', true);
            palette.saveCanvasState();
          };
        });

      // Sorry again, I know that there's no need for return here,
      // but I put it here, because otherwise eslint will say about unused variables... :)
      return response;
    })();
  },

  imageLoaded: false,

  blackAndWhite() {
    if (palette.imageLoaded) {
      const imgData = canvasContext.getImageData(0, 0, canvas.width, canvas.height);
      const pixels = imgData.data;
      for (let i = 0; i < pixels.length; i += 4) {
        const grayScale = pixels[i] * 0.3 + pixels[i + 1] * 0.59 + pixels[i + 2] * 0.11;
        pixels[i] = grayScale;
        pixels[i + 1] = grayScale;
        pixels[i + 2] = grayScale;
      }
      canvasContext.putImageData(imgData, 0, 0);
      palette.saveCanvasState();
    } else {
      warningText.innerHTML = 'Load an image before black-and-white convertion!';
      warning.classList.remove('invisible');
    }
  },

  changeMatrixSize(matrixButtonValue) {
    const matrixSize = matrixButtonValue;

    let newCanvas = document.createElement('canvas');
    newCanvas.height = matrixSize;
    newCanvas.width = matrixSize;
    let newCanvasContext = newCanvas.getContext('2d');
    newCanvasContext.drawImage(canvas, 0, 0, matrixSize, matrixSize);
    canvasContext.drawImage(newCanvas, 0, 0, 512, 512);
    newCanvasContext = undefined;
    newCanvas = undefined;

    palette.matrixSize = matrixSize;
    localStorage.setItem('paletteMatrixSize', matrixSize);
  },
};


canvas.addEventListener('mousedown', (event) => {
  if (palette.tools.pencil) {
    palette.isDrawing = true;

    palette.xStart = event.offsetX - ((event.offsetX) % palette.matrixCoefficient);
    palette.yStart = event.offsetY - ((event.offsetY) % palette.matrixCoefficient);

    palette.drawBresenhamLine(palette.xStart, palette.yStart,
      palette.xStart, palette.yStart,
      palette.matrixCoefficient);
  }

  if (palette.tools.chooseColor) {
    const imgData = canvasContext.getImageData(event.offsetX, event.offsetY, 1, 1);
    const hexColor = palette.rgba2hex(`rgba(${imgData.data[0]}, ${imgData.data[1]}, ${imgData.data[2]}, ${imgData.data[3] / 255})`);
    if (palette.currentColor !== hexColor) {
      palette.changeColor(hexColor);
    }
  }

  if (palette.tools.fillBucket) {
    palette.fillBucket(event, palette.matrixCoefficient);
  }
});

canvas.addEventListener('mousemove', (event) => {
  if (palette.isDrawing && palette.tools.pencil) {
    palette.drawBresenhamLine(palette.xStart, palette.yStart,
      event.offsetX - ((event.offsetX) % palette.matrixCoefficient),
      event.offsetY - ((event.offsetY) % palette.matrixCoefficient),
      palette.matrixCoefficient);
    palette.xStart = event.offsetX - ((event.offsetX) % palette.matrixCoefficient);
    palette.yStart = event.offsetY - ((event.offsetY) % palette.matrixCoefficient);
  }
});

canvas.addEventListener('mouseup', () => {
  palette.isDrawing = false;
  if (palette.tools.pencil || palette.tools.fillBucket) {
    palette.saveCanvasState();
  }
});

canvas.addEventListener('mouseout', () => {
  palette.isDrawing = false;
  if (palette.tools.pencil || palette.tools.fillBucket) {
    palette.saveCanvasState();
  }
});

colorInput.addEventListener('change', (event) => {
  palette.changeColor(event.target.value);
});

currentColorButton.addEventListener('click', () => {
  colorInput.click();
});

previousColorButton.addEventListener('click', () => {
  colorInput.value = palette.previousColor;
  palette.changeColor(palette.previousColor);
});

redColorButton.addEventListener('click', () => {
  if (palette.currentColor !== '#ff0000') {
    palette.changeColor('#ff0000');
    colorInput.value = '#ff0000';
  }
});

blueColorButton.addEventListener('click', () => {
  if (palette.currentColor !== '#0000ff') {
    palette.changeColor('#0000ff');
    colorInput.value = '#0000ff';
  }
});

const mainToolsButtonArr = document.querySelectorAll('.main-tools-button');
pencilButton.addEventListener('click', () => {
  const arr = Object.keys(palette.tools);
  for (let i = 0; i < arr.length; i += 1) {
    palette.tools[arr[i]] = false;
  }
  palette.tools.pencil = true;
  for (let i = 0; i < mainToolsButtonArr.length; i += 1) {
    mainToolsButtonArr[i].classList.remove('pressed');
  }
  pencilButton.classList.add('pressed');
  localStorage.setItem('paletteButton', 'pencil');
});

fillBucketButton.addEventListener('click', () => {
  const arr = Object.keys(palette.tools);
  for (let i = 0; i < arr.length; i += 1) {
    palette.tools[arr[i]] = false;
  }
  palette.tools.fillBucket = true;
  for (let i = 0; i < mainToolsButtonArr.length; i += 1) {
    mainToolsButtonArr[i].classList.remove('pressed');
  }
  fillBucketButton.classList.add('pressed');
  localStorage.setItem('paletteButton', 'fillBucket');
});

chooseColorButton.addEventListener('click', () => {
  const arr = Object.keys(palette.tools);
  for (let i = 0; i < arr.length; i += 1) {
    palette.tools[arr[i]] = false;
  }
  palette.tools.chooseColor = true;
  for (let i = 0; i < mainToolsButtonArr.length; i += 1) {
    mainToolsButtonArr[i].classList.remove('pressed');
  }
  chooseColorButton.classList.add('pressed');
  localStorage.setItem('paletteButton', 'chooseColor');
});

window.addEventListener('keydown', (event) => {
  if (event.code === 'KeyB') {
    fillBucketButton.click();
  }
  if (event.code === 'KeyC') {
    chooseColorButton.click();
  }
  if (event.code === 'KeyP') {
    pencilButton.click();
  }
});

const loadButton = document.querySelector('.canvas-buttons__load-button');
const inputCity = document.querySelector('.canvas-buttons__input');
loadButton.addEventListener('click', () => {
  if (inputCity.value === '') {
    warningText.innerHTML = 'Please, enter the city';
    warning.classList.remove('invisible');
  } else {
    palette.inputValue = inputCity.value;
    palette.getLinkToImage();
  }
});

const blackAndWhiteButton = document.querySelector('.canvas-buttons__black-and-white-button');
blackAndWhiteButton.addEventListener('click', () => {
  palette.blackAndWhite();
});

const matrixButton128x128 = document.querySelector('.canvas-matrix-size-buttons__128x128');
const matrixButton256x256 = document.querySelector('.canvas-matrix-size-buttons__256x256');
const matrixButton512x512 = document.querySelector('.canvas-matrix-size-buttons__512x512');
matrixButton128x128.addEventListener('click', () => {
  palette.changeMatrixSize(128);
  palette.saveCanvasState();
});
matrixButton256x256.addEventListener('click', () => {
  palette.changeMatrixSize(256);
  palette.saveCanvasState();
});
matrixButton512x512.addEventListener('click', () => {
  palette.changeMatrixSize(512);
  palette.saveCanvasState();
});

const warningButton = document.querySelector('.warning__button');
warningButton.addEventListener('click', () => {
  warning.classList.add('invisible');
});

window.addEventListener('DOMContentLoaded', () => {
  if (localStorage.getItem('canvasState')
      || localStorage.getItem('paletteButton')
      || localStorage.getItem('paletteCurrentColor')
      || localStorage.getItem('palettePreviousColor')
      || localStorage.getItem('paletteImageLoaded')
      || localStorage.getItem('paletteMatrixSize')) {
    palette.loadFromStorage();
  } else {
    palette.initButtonColors();
  }

  if (localStorage.getItem('canvasState') !== null) {
    palette.loadCanvasState();
  }
});
