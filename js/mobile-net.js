let model;
async function loadModel() {
  console.log("model loading..");
  loader = document.getElementById("progress-box");
  load_button = document.getElementById("load-button");
  loader.style.display = "block";
  modelName = "mobilenet";
  model = undefined;
  
  try {
    model = await tf.loadLayersModel("sc_detector/artifacts/tfjs/mobilen_model/model.json");
    loader.style.display = "none";
    load_button.disabled = true;
    load_button.classList.add('loaded');
    load_button.innerHTML = "Model Loaded ✓";
    console.log("model loaded..");
  } catch (error) {
    console.error("Error loading model:", error);
    loader.style.display = "none";
    load_button.innerHTML = "Load Failed ✗";
    load_button.style.backgroundColor = "#ef4444";
  }
}

async function loadFile() {
  console.log("image is in loadfile..");
  document.getElementById("select-file-box").style.display = "table-cell";
  document.getElementById("predict-box").style.display = "table-cell";
  document.getElementById("prediction").innerHTML =
    "Click Detect to find the type of Skin Cancer!";
  var fileInputElement = document.getElementById("select-file-image");
  console.log(fileInputElement.files[0]);
  renderImage(fileInputElement.files[0]);
}

function renderImage(file) {
  var reader = new FileReader();
  console.log("image is here..");
  reader.onload = function (e) {
    let img = document.getElementById("test-image");
    img.src = e.target.result;
    img.classList.remove('image-loaded');
    // Trigger reflow
    void img.offsetWidth;
    img.classList.add('image-loaded');
  };
  reader.readAsDataURL(file);
}

var chart = "";
var firstTime = 0;
function loadChart(label, data) {
  var ctx = document.getElementById("myChart").getContext("2d");
  if (firstTime == 0) {
    firstTime = 1;
    chart = new Chart(ctx, {
      type: "bar",
      data: {
        labels: label,
        datasets: [
          {
            data: data,
            backgroundColor: [
              'rgba(79, 70, 229, 0.8)',  // Indigo
              'rgba(99, 102, 241, 0.8)',  // Lighter indigo
              'rgba(129, 140, 248, 0.8)', // Even lighter indigo
              'rgba(165, 180, 252, 0.8)',
              'rgba(199, 210, 254, 0.8)',
              'rgba(224, 231, 255, 0.8)',
              'rgba(238, 242, 255, 0.8)',
            ],
            borderColor: [
              'rgb(79, 70, 229)',
              'rgb(99, 102, 241)',
              'rgb(129, 140, 248)',
              'rgb(165, 180, 252)',
              'rgb(199, 210, 254)',
              'rgb(224, 231, 255)',
              'rgb(238, 242, 255)',
            ],
            borderWidth: 2,
            borderRadius: 8,
            borderSkipped: false,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
          duration: 1000,
          easing: 'easeInOutQuart'
        },
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            backgroundColor: 'rgba(45, 46, 50, 0.9)',
            titleColor: '#fff',
            bodyColor: '#fff',
            padding: 12,
            borderColor: 'rgba(255, 255, 255, 0.1)',
            borderWidth: 1,
            cornerRadius: 8,
            displayColors: false,
            callbacks: {
              label: function(context) {
                return `Probability: ${(context.raw * 100).toFixed(2)}%`;
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: {
              color: 'rgba(255, 255, 255, 0.1)',
              borderColor: 'rgba(255, 255, 255, 0.1)'
            },
            ticks: {
              color: '#fff',
              font: {
                family: "'Nunito', sans-serif",
                size: 12
              },
              callback: function(value) {
                return (value * 100).toFixed(0) + '%';
              }
            }
          },
          x: {
            grid: {
              display: false
            },
            ticks: {
              color: '#fff',
              font: {
                family: "'Nunito', sans-serif",
                size: 12
              },
              maxRotation: 45,
              minRotation: 45
            }
          }
        }
      }
    });
  } else {
    chart.data.labels = label;
    chart.data.datasets[0].data = data;
    chart.update();
  }
  
  // Add loading animation
  document.getElementById('chart-box').classList.add('chart-loaded');
}

const skinConditionTypes = {
  'Actinic Keratoses (akiec)': 'Malignant',
  'Basal Cell Carcinoma (bcc)': 'Malignant',
  'Benign Keratosis (bkl)': 'Benign',
  'Dermatofibroma (df)': 'Benign',
  'Melanoma (mel)': 'Malignant',
  'Melanocytic Nevi (nv)': 'Benign',
  'Vascular Lesion (vasc)': 'Benign'
};

async function predButton() {
  console.log("model loading..");

  if (model == undefined) {
    alert("Please load the model first...");
  }
  if (document.getElementById("predict-box").style.display == "none") {
    alert("Please load an image using 'Demo Image' or 'Upload Image' with the button...");
  }
  console.log(model);
  let image = document.getElementById("test-image");
  let tensor = preprocessImage(image, modelName);

  let predictions = await model.predict(tensor).data();
  let results_all = Array.from(predictions)
    .map(function (p, i) {
      return {
        probability: p,
        className: TARGET_CLASSES[i],
        index: i,
      };
    })
    .sort(function (a, b) {
      return b.probability - a.probability;
    });

  let results = results_all.slice(0, 3);

  let classes = [
    "Actinic Keratoses (akiec)",
    "Basal Cell Carcinoma (bcc)",
    "Benign Keratosis (bkl)",
    "Dermatofibroma (df)",
    "Melanoma (mel)",
    "Melanocytic Nevi (nv)",
    "Vascular Lesion (vasc)"
  ];

  let predictedClass = classes[results[0].index];
  let conditionType = skinConditionTypes[predictedClass];

  document.getElementById("predict-box").style.display = "block";
  // Format prediction text with condition type
  document.getElementById("prediction").innerHTML = 
    `<div class="prediction-title">Type of Skin Cancer is:</div>
     <div class="prediction-result">
       <span class="prediction-highlight">${predictedClass}</span>
     </div>
     <span class="condition-type ${conditionType.toLowerCase()}">${conditionType}</span>`;

  var ul = document.getElementById("predict-list");
  ul.innerHTML = "";

  for(let i = 0; i < results.length; i++) {
    let index = results[i].index;
    let className = classes[index];
    let probability = results[i].probability * 100;
    ul.innerHTML += `
      <li>
        <span class="cancer-name">${className}</span>
        <span class="percentage">${probability.toFixed(1)}%</span>
      </li>`;
  }

  const ctx = document.getElementById('predChart').getContext('2d');
  
  // Destroy existing chart if it exists
  if (window.predictionChart) {
    window.predictionChart.destroy();
  }
  
  // Create sorted indices array for colors
  let sortedIndices = Array.from(predictions.keys());
  sortedIndices.sort((a, b) => predictions[b] - predictions[a]);

  // Create color arrays based on prediction order
  let backgroundColors = Array(predictions.length).fill('rgba(45, 46, 50, 0.2)');
  let borderColors = Array(predictions.length).fill('rgba(45, 46, 50, 1)');
  
  // Set colors for top 3
  backgroundColors[sortedIndices[0]] = 'rgba(0, 255, 30, 0.2)';  // Green
  backgroundColors[sortedIndices[1]] = 'rgba(193, 190, 20, 0.2)'; // Yellow
  backgroundColors[sortedIndices[2]] = 'rgba(205, 50, 50, 0.2)';  // Red
  
  borderColors[sortedIndices[0]] = 'rgba(0, 255, 30, 1)';  // Green
  borderColors[sortedIndices[1]] = 'rgba(193, 190, 20, 1)'; // Yellow
  borderColors[sortedIndices[2]] = 'rgba(205, 50, 50, 1)';  // Red

  // Create new chart
  window.predictionChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: classes,
      datasets: [{
        label: 'Prediction Confidence',
        data: predictions.map(p => (p * 100).toFixed(1)),
        backgroundColor: backgroundColors,
        borderColor: borderColors,
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          max: 100,
          ticks: {
            color: '#ffffff'
          },
          grid: {
            color: 'rgba(255, 255, 255, 0.1)'
          }
        },
        x: {
          ticks: {
            color: '#ffffff',
            maxRotation: 45,
            minRotation: 45
          },
          grid: {
            color: 'rgba(255, 255, 255, 0.1)'
          }
        }
      }
    }
  });

  document.getElementById("chart-box").style.display = "block";
}

function preprocessImage(image, modelName) {
  let tensor = tf.browser
    .fromPixels(image)
    .resizeNearestNeighbor([224, 224])
    .toFloat();

  if (modelName === undefined) {
    return tensor.expandDims();
  } else if (modelName === "mobilenet") {
    let offset = tf.scalar(127.5);
    return tensor.sub(offset).div(offset).expandDims();
  } else {
    alert("Unknown model name...");
  }
}

function loadDemoImage() {
  document.getElementById("predict-box").style.display = "table-cell";
  document.getElementById("prediction").innerHTML =
    "Click Detect to find the type of Skin Cancer!";
  document.getElementById("select-file-box").style.display = "table-cell";
  document.getElementById("predict-list").innerHTML = "";

  base_path = "./assets/demo.jpg";
  img_path = base_path;
  document.getElementById("test-image").src = img_path;
}

function showLoading() {
  document.getElementById('progress-box').style.display = 'block';
  document.getElementById('loading-overlay').style.display = 'block';
}

function hideLoading() {
  document.getElementById('progress-box').style.display = 'none';
  document.getElementById('loading-overlay').style.display = 'none';
}
