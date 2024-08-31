const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const path = require('path');
const session = require('express-session');
const Developer = require('./models/Developer');
const Property = require('./models/Property');
const Task = require('./models/Task');
const User = require('./models/User');
const Test = require('./models/Test');
const multer = require('multer');
require('dotenv').config();

// Configure Multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // Set your upload folder
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname)); // Append file extension
  }
});
const upload = multer({
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 } // Set file size limit (5 MB)
});
const app = express();
const PORT = process.env.PORT || 4000;
app.use('/files', express.static(path.join(__dirname, 'uploads')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, 'public')));


// Middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(session({
  secret: 'your-secret-key', // Change this to a more secure secret
  resave: false,
  saveUninitialized: true,
}));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));



// Connect to MongoDB
const mongoURI = process.env.MONGODB_URI;

if (!mongoURI) {
  console.error('MongoDB URI is not defined in environment variables');
  process.exit(1);
}

mongoose.connect(mongoURI)
  .then(() => {
    console.log('MongoDB connected successfully');
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Admin access middleware
const isAdmin = (req, res, next) => {
  if (req.session.isAdmin) {
    return next();
  }
  res.sendFile(path.join(__dirname, 'views', 'verify-code.html'));
};

// Route to display properties





// Route to display add property form (restricted to admin)
app.get('/add', isAdmin, async (req, res) => {
  try {
    const developers = await Developer.find(); // Assuming 'Developer' is your model
    const property = await Property.find();
    res.render('add', { developers,property });
  } catch (err) {
    res.status(500).send("Error fetching developers");
  }
});

app.get('/addDev', (req, res) => {
  res.render('addDeveloper', { developer: {} }); // Pass an empty object or provide default values
});


app.get('/addTest', (req, res) => {
  res.render('test'); // Pass an empty object or provide default values
});

// Handle adding new property


// Handle adding new developer
app.post('/addTest', upload.single('logo'), async (req, res) => {
  try {
    const { name, longDescription, cityPresent } = req.body;
    const logo = req.file ? req.file.path : ''; // Get file path if file uploaded

    const newTest = new Test({
      logo,
      name,
      longDescription,
      cityPresent,
    });

    await newTest.save();
    res.redirect('/admin'); // Redirect to admin or another page
  } catch (err) {
    console.error('Error adding test:', err);
    res.status(500).send('Server Error');
  }
});

// Handle adding new developer



// Admin code verification route
app.post('/verify-code', (req, res) => {
  const { code } = req.body;
  const accessCode = '9671'; // Code to access the admin dashboard

  if (code === accessCode) {
    req.session.isAdmin = true;
    res.redirect('/admin');
  } else {
    res.status(401).send('Unauthorized');
  }
});


// Admin dashboard
app.get('/admin', isAdmin, async (req, res) => {
  try {
    const properties = await Property.find();
    const developers = await Developer.find();
    const tasks = await Task.find();
    const users = await User.find();
    const tests = await Test.find(); // Fetch tests data

    res.render('admin-dashboard', { properties, developers, users, tasks, tests });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});





// Route to display edit property form (restricted to admin)
app.get('/admin/edit/property/:id', isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const property = await Property.findById(id);
    if (!property) {
      return res.status(404).send('Property not found');
    }
    res.render('editProperty', { property });
  } catch (err) {
    res.status(500).send('Server Error');
  }
});


// Route to display edit developer form (restricted to admin)
app.get('/admin/edit/developer/:id', isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const developer = await Developer.findById(id);
    if (!developer) {
      return res.status(404).send('Developer not found');
    }
    res.render('editDeveloper', { developer });
  } catch (err) {
    res.status(500).send('Server Error');
  }
});
app.get('/admin/edit/test/:id', isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const test = await Test.findById(id);
    if (!test) {
      return res.status(404).send('Test not found'); // Updated error message
    }
    res.render('editTest', { test });
  } catch (err) {
    res.status(500).send('Server Error');
  }
});


// Handle updating a property
app.post('/admin/update/property/:id', isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      by,
      location,
      price,
      status,
      configuration,
      possession,
      units,
      land,
      residence,
      builtup,
      blocks,
      floor,
      noofunits,
      rera,
      highlight,
      about,
      unitytype,
      size,
      range,
      booking,
      token,
      plans,
      amenities,
      virtual,
      categories, // Should be an array of strings
      imageUrl
    } = req.body;

    const updatedProperty = await Property.findByIdAndUpdate(id, {
      name,
      by,
      location,
      price,
      status,
      configuration,
      possession: possession ? new Date(possession) : undefined, // Convert to Date if present
      units,
      land,
      residence,
      builtup,
      blocks,
      floor,
      noofunits,
      rera,
      highlight,
      about,
      unitytype,
      size,
      range,
      booking,
      token,
      plans,
      amenities,
      virtual,
      categories: categories ? categories.split(',') : [], // Convert comma-separated string to array
      imageUrl
    }, { new: true });

    if (!updatedProperty) {
      return res.status(404).send('Property not found');
    }
    res.redirect('/admin');
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

// Handle updating a developer
app.post('/admin/update/developer/:id', isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      logo,
      name,
      established,
      project,
      shortDescription,
      longDescription,
      ongoingProjects,
      cityPresent,
    } = req.body;

    const updatedDeveloper = await Developer.findByIdAndUpdate(id, {
      logo,
      name,
      established,
      project,
      shortDescription,
      longDescription,
      ongoingProjects,
      cityPresent,
    }, { new: true });

    if (!updatedDeveloper) {
      return res.status(404).send('Developer not found');
    }
    res.redirect('/admin');
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

app.post('/admin/update/test/:id', isAdmin, upload.single('logo'), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, longDescription, cityPresent } = req.body;
    const logo = req.file ? req.file.path : req.body.existingLogo; // Handle file or keep existing logo

    const updatedTest = await Test.findByIdAndUpdate(id, {
      logo,
      name,
      longDescription,
      cityPresent,
    }, { new: true });

    if (!updatedTest) {
      return res.status(404).send('Test not found');
    }
    res.redirect('/admin');
  } catch (err) {
    console.error(err); // Log the error for debugging
    res.status(500).send('Server Error');
  }
});

// Handle deletion of a property or developer
app.post('/admin/delete/:id', isAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const propertyDeletion = Property.findByIdAndDelete(id);
    const developerDeletion = Developer.findByIdAndDelete(id);
    const testDeletion = Test.findByIdAndDelete(id);

    await Promise.all([propertyDeletion, developerDeletion, testDeletion]);

    res.redirect('/admin');
  } catch (err) {
    res.status(500).send('Server Error');
  }
});


// Logout route
app.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/');
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});


app.post('/add-user', async (req, res) => {
  const { name, email, number } = req.body;

  // Basic validation
  if (!name || !email || !number) {
    return res.status(400).send('All fields are required');
  }

  try {
    // Create a new user instance and save it
    const user = new User({ name, email, number });
    await user.save();
    res.redirect('/'); // Redirect to the admin dashboard
  } catch (error) {
    console.error('Error saving user:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.post('/upload', upload.single('file'), (req, res) => {
  console.log(req.file);
  res.send('File uploaded successfully');
});
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.post('/add', isAdmin, upload.fields([
  { name: 'imageUrl', maxCount: 1 },
  { name: 'floorImg1', maxCount: 1 },
  { name: 'floorImg2', maxCount: 1 },
  { name: 'floorImg3', maxCount: 1 },
  { name: 'floorImg4', maxCount: 1 },
  { name: 'floorImg5', maxCount: 1 },
  { name: 'floorImg6', maxCount: 1 },
  { name: 'floorImg7', maxCount: 1 },
  { name: 'floorImg8', maxCount: 1 },
  { name: 'floorImg9', maxCount: 1 },
  { name: 'floorImg10', maxCount: 1 },
  { name: 'logo1', maxCount: 1 },
  { name: 'logo2', maxCount: 1 },
  { name: 'logo3', maxCount: 1 },
  { name: 'logo4', maxCount: 1 },
  { name: 'logo5', maxCount: 1 },
  { name: 'logo6', maxCount: 1 },
  { name: 'logo7', maxCount: 1 },
  { name: 'logo8', maxCount: 1 },
  { name: 'logo9', maxCount: 1 },
  { name: 'logo10', maxCount: 1 },
  { name: 'virtualImg1', maxCount: 1 },
  { name: 'virtualImg2', maxCount: 1 },
  { name: 'virtualImg3', maxCount: 1 },
  { name: 'virtualImg4', maxCount: 1 },
  { name: 'virtualImg5', maxCount: 1 },
  { name: 'virtualImg6', maxCount: 1 },
  { name: 'virtualImg7', maxCount: 1 },
  { name: 'virtualVid8', maxCount: 1 },
  { name: 'virtualVid9', maxCount: 1 },
  { name: 'virtualVid10', maxCount: 1 },
  { name: 'pdf1', maxCount: 1 },
  { name: 'pdf2', maxCount: 1 },
  { name: 'pdf3', maxCount: 1 },
  { name: 'pdf4', maxCount: 1 }
]), async (req, res) => {
  try {
    // Log the submitted developer ID
    console.log('Submitted Developer ID:', req.body.developerId);

    // Find and validate the developer by ID
    const developer = await Developer.findById(req.body.developerId);
    if (!developer) {
      console.log('Developer not found.');
      return res.status(404).send('Unknown Developer');
    }


    // Continue with the property creation
    const {
      virtualImg1,
      name,
      location,
      price,
      status,
      configuration,
      possession,
      units,
      land,
      residence,
      builtup,
      blocks,
      floor,
      noofunits,
      rera,
      point1,
      point2,
      point3,
      point4,
      point5,
      point6,
      point7,
      point8,
      point9,
      point10,
      about,
      unitytype,
      size,
      range,
      booking,
      token,
      plans,
      amenities,
      virtual,
      categories,
      dis1,
      dis2,
      dis3,
      dis4,
      dis5,
      dis6,
      dis7,
      dis8,
      dis9,
      dis10,
      payment,
      logoText1,
      logoText2,
      logoText3,
      logoText4,
      logoText5,
      logoText6,
      logoText7,
      logoText8,
      logoText9,
      logoText10
    } = req.body;

    // Retrieve file paths from req.files
    const floorImgs = [];
    for (let i = 1; i <= 10; i++) {
      const field = `floorImg${i}`;
      floorImgs.push(req.files[field] ? req.files[field][0].path : '');
    }

    const logos = [];
    for (let i = 1; i <= 10; i++) {
      const field = `logo${i}`;
      logos.push(req.files[field] ? req.files[field][0].path : '');
    }

    const virtualImgs = [];
    for (let i = 1; i <= 8; i++) {
      const field = `virtualImg${i}`;
      virtualImgs.push(req.files[field] ? req.files[field][0].path : '');
    }

    const virtualVids = [];
    for (let i = 8; i <= 10; i++) {
      const field = `virtualVid${i}`;
      virtualVids.push(req.files[field] ? req.files[field][0].path : '');
    }

    const pdfs = [];
    for (let i = 1; i <= 4; i++) {
      const field = `pdf${i}`;
      pdfs.push(req.files[field] ? req.files[field][0].path : '');
    }

    // Ensure categories is an array
    const parsedCategories = Array.isArray(categories) ? categories : categories ? categories.split(',') : [];

    const newProperty = new Property({
      imageUrl: req.files['imageUrl'] ? req.files['imageUrl'][0].path : '',
      name,
      by: req.body.developerId, // Use the developerId from the form submission
      location,
      price,
      status,
      configuration,
      possession: possession ? new Date(possession) : undefined,
      units,
      land,
      residence,
      builtup,
      blocks,
      floor,
      noofunits,
      rera,
      point1,
      point2,
      point3,
      point4,
      point5,
      point6,
      point7,
      point8,
      point9,
      point10,
      about,
      unitytype,
      size,
      range,
      booking,
      token,
      plans,
      floorImg1: req.files['floorImg1'] ? req.files['floorImg1'][0].path : '',
      floorImg2: req.files['floorImg2'] ? req.files['floorImg2'][0].path : '',
      floorImg3: req.files['floorImg3'] ? req.files['floorImg3'][0].path : '',
      floorImg4: req.files['floorImg4'] ? req.files['floorImg4'][0].path : '',
      floorImg5: req.files['floorImg5'] ? req.files['floorImg5'][0].path : '',
      floorImg6: req.files['floorImg6'] ? req.files['floorImg6'][0].path : '',
      floorImg7: req.files['floorImg7'] ? req.files['floorImg7'][0].path : '',
      floorImg8: req.files['floorImg8'] ? req.files['floorImg8'][0].path : '',
      floorImg9: req.files['floorImg9'] ? req.files['floorImg9'][0].path : '',
      floorImg10: req.files['floorImg10'] ? req.files['floorImg10'][0].path : '',
      amenities,
      virtual,
      categories: parsedCategories,
      dis1,
      dis2,
      dis3,
      dis4,
      dis5,
      dis6,
      dis7,
      dis8,
      dis9,
      dis10,
      payment,
      pdfs, // Array of PDF paths
      logoText1,
      logoText2,
      logoText3,
      logoText4,
      logoText5,
      logoText6,
      logoText7,
      logoText8,
      logoText9,
      logoText10,
      virtualImg1: req.files['virtualImg1'] ? req.files['virtualImg1'][0].path : '',
      virtualImg2: req.files['virtualImg2'] ? req.files['virtualImg2'][0].path : '',
      virtualImg3: req.files['virtualImg3'] ? req.files['virtualImg3'][0].path : '',
      virtualImg4: req.files['virtualImg4'] ? req.files['virtualImg4'][0].path : '',
      virtualImg5: req.files['virtualImg5'] ? req.files['virtualImg5'][0].path : '',
      virtualImg6: req.files['virtualImg6'] ? req.files['virtualImg6'][0].path : '',
      virtualImg7: req.files['virtualImg7'] ? req.files['virtualImg7'][0].path : '',
      virtualVid8: req.files['virtualVid8'] ? req.files['virtualVid8'][0].path : '',
      virtualVid9: req.files['virtualVid9'] ? req.files['virtualVid9'][0].path : '',
      virtualVid10: req.files['virtualVid10'] ? req.files['virtualVid10'][0].path : '',
      floorImgs, // Array of floor image paths
      logos, // Array of logo paths
      virtualVids // Array of video paths
    });

    await newProperty.save();
    console.log(newProperty)
    console.log('Files:', req.files);
    res.redirect('/');
  } catch (err) {
    console.error(err); // Log error details for debugging
    res.status(500).send('Server Error');
  }
});


app.post('/add-developer', isAdmin, async (req, res) => {
  const {
    id,
    logo,
    name,
    established,
    project,
    shortDescription,
    longDescription,
    ongoingProjects = [],  // Default to empty array if not provided
    cityPresent = []       // Default to empty array if not provided
  } = req.body;

  // Create a new Developer with the provided data
  const newDeveloper = new Developer({
    id,                    // Ensure this is a string
    logo,
    name,
    established,
    project,
    shortDescription,
    longDescription,
    ongoingProjects,       // Directly assign array
    cityPresent            // Directly assign array
  });

  try {
    await newDeveloper.save();
    res.redirect('/');
  } catch (error) {
    console.error('Error adding developer:', error);
    res.status(500).send('Internal Server Error');
  }
});







app.get('/add-developer', (req, res) => {
  res.render('add-developer'); // Ensure this matches the name of your EJS file
});

app.get("/developerD", (req, res) => {
  res.render("developer-details")
})



app.get('/developers', async (req, res) => {
  try {
    const developers = await Developer.find();
    console.log('Developers:', developers); // Log developers to check data
    res.render('developers', { developers });
  } catch (error) {
    console.error('Error fetching developers:', error);
    res.status(500).send('Internal Server Error');
  }
});


// Route to render a personal page for a developer
app.get('/developer/:id', async (req, res) => {
  try {
    const developerId = req.params.id;
    console.log(developerId)
    const developer = await Developer.findById(developerId);
    console.log(developer)
    if (!developer) {
      return res.status(404).send('Developer not found');
    }
    const details = await Task.find({ developerId }).exec(); // Adjust this according to your actual data structure

    res.render('developers', { developer, details });
  } catch (error) {
    console.error('Error fetching developer data:', error);
    res.status(500).send('Internal Server Error');
  }
});



app.get('/', async (req, res) => {
  try {
    const selectedCategories = req.query.categories ? req.query.categories.split(',') : [];
    const searchQuery = req.query.search ? req.query.search : ''; // Get search query

    // Build property filter
    let propertyFilter = {};

    if (selectedCategories.length > 0) {
      propertyFilter.categories = { $in: selectedCategories };
    }

    if (searchQuery) {
      // Add search query to filter
      propertyFilter.$or = [
        { name: { $regex: searchQuery, $options: 'i' } },
        { description: { $regex: searchQuery, $options: 'i' } }
      ];
    }

    // Fetch data from database
    const allProperties = await Property.find(propertyFilter);
    const allDevelopers = await Developer.find(); // Fetch developers
    const allTests = await Test.find(); // Fetch details

    // Categorize properties
    const categorizedProperties = {
      trending: allProperties.filter(p => p.categories.includes('Trending')),
      ultra: allProperties.filter(p => p.categories.includes('Ultra luxury')),
      luxury: allProperties.filter(p => p.categories.includes('Luxury Project')),
      premium: allProperties.filter(p => p.categories.includes('Premium Project')),
      affordable: allProperties.filter(p => p.categories.includes('Affordable Project')),
    };

    // Render the view
    res.render('index', {
      properties: categorizedProperties,
      developers: allDevelopers,
      tests: allTests,
      isAdmin: req.session.isAdmin,
      searchQuery: searchQuery,  // Pass searchQuery to the view
      selectedCategories: selectedCategories // Pass selectedCategories to the view
    });
  } catch (err) {
    console.error('Error fetching data:', err); // Log error details
    res.status(500).send('Server Error');
  }
});



app.get('/property/:id', async (req, res) => {
  console.log('Received request for /property/:id');
  try {
    const propertyId = req.params.id;
    console.log('Property ID:', propertyId);

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(propertyId)) {
      console.error('Invalid property ID:', propertyId);
      return res.status(400).send('Invalid property ID');
    }

    // Fetch the property
    const property = await Property.findById(propertyId);
    console.log('Fetched Property:', property);

    if (!property) {
      console.error('Property not found for ID:', propertyId);
      return res.status(404).send('Property not found');
    }

    // Assuming `property` has a `categories` array
    const categorizedProperties = {
      trending: property.categories.includes('Trending') ? [property] : [],
      ultra: property.categories.includes('Ultra luxury') ? [property] : [],
      luxury: property.categories.includes('Luxury Project') ? [property] : [],
      premium: property.categories.includes('Premium Project') ? [property] : [],
      affordable: property.categories.includes('Affordable Project') ? [property] : [],
    };

    console.log('Categorized Properties:', categorizedProperties);

    // Render the EJS template with the categorized properties
    res.render('property', {
      categories: categorizedProperties
    });

  } catch (err) {
    console.error('Error fetching property:', err);
    res.status(500).send('Server Error');
  }
});

app.get('/search', (req, res) => {
  const query = req.query.query.toLowerCase();
  const results = items.filter(item => item.name.toLowerCase().includes(query));
  res.json(results); // Return results as JSON
});
