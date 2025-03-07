const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const app = express();
const port = 3000;

// Set up Multer for file uploads
const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

app.set("view engine", "ejs");
app.use(express.static("uploads"));
app.use(express.static("public"));
app.use(express.json());

// Function to read and write like/unlike/download counts
const dataFile = "data.json";

function readData() {
  try {
    return JSON.parse(fs.readFileSync(dataFile, "utf8"));
  } catch (err) {
    return {};
  }
}

function writeData(data) {
  fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
}

// Home Page
app.get("/", (req, res) => {
  res.render("index", { uploadedFile: null });
});

// Handle File Upload
app.post("/upload", upload.single("file"), (req, res) => {
  res.render("index", { uploadedFile: req.file ? req.file.filename : null });
});

// Gallery Page to show uploaded images
app.get("/gallery", (req, res) => {
  fs.readdir("uploads/", (err, files) => {
    if (err) {
      console.error("Error reading uploads directory:", err);
      return res.status(500).send("Internal Server Error");
    }

    let imageData = readData();
    files.forEach((file) => {
      if (!imageData[file]) {
        imageData[file] = { likes: 0, unlikes: 0, downloads: 0 };
      }
    });

    writeData(imageData);
    res.render("gallery", { uploadedImages: files, imageData });
  });
});

// Handle Like
app.post("/like/:image", (req, res) => {
  let imageData = readData();
  const image = req.params.image;

  if (imageData[image]) {
    imageData[image].likes += 1;
    writeData(imageData);
  }
  res.json({ success: true, likes: imageData[image].likes });
});

// Handle Unlike
app.post("/unlike/:image", (req, res) => {
  let imageData = readData();
  const image = req.params.image;

  if (imageData[image]) {
    imageData[image].unlikes += 1;
    writeData(imageData);
  }
  res.json({ success: true, unlikes: imageData[image].unlikes });
});

// Handle Download
app.get("/download/:image", (req, res) => {
  let imageData = readData();
  const image = req.params.image;
  const filePath = path.join(__dirname, "uploads", image);

  if (fs.existsSync(filePath)) {
    if (imageData[image]) {
      imageData[image].downloads += 1;
      writeData(imageData);
    }
    res.download(filePath);
  } else {
    res.status(404).send("File not found");
  }
});

// Start Server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
