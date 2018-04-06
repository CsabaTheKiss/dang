const mongoose = require('mongoose');
const Store = mongoose.model('Store');
const User = mongoose.model('User');
const multer = require('multer');
const jimp = require('jimp'); // for photo resize
const uuid = require('uuid'); // uniq ids for photo names

// for photo upload
const multerOptions = {
  storage: multer.memoryStorage(), // store the photo in server memory
  fileFilter (req, file, next) {
    const isPhoto = file.mimetype.startsWith('image/');
      if (isPhoto) {
        next(null, true); // just as a promise: true for success
      } else {
        next({ message: 'That filetype isn\'t allowed!'})
      }
  }
}

exports.homePage = (req, res) => {
  res.render('index');
};

exports.addStore = (req, res) => {
  res.render('editStore', { title: 'Add store' });
};

exports.upload = multer(multerOptions).single('photo');

exports.resize = async (req, res, next) => {
  // previous 'upload' middleware created .file on req
  if (!req.file) {
    next(); // skip to next middleware
    return;
  }
  const extension = req.file.mimetype.split('/')[1];
  req.body.photo = `${uuid.v4()}.${extension}`;
  // resize
  const photo = await jimp.read(req.file.buffer);
  await photo.resize(800, jimp.AUTO);
  // save
  await photo.write(`./public/uploads/${req.body.photo}`);
  console.log('photo written on disc to: ', `./public/uploads/${req.body.photo}`);
  next(); // pass it to the next middleware
}

// async await ES8 feature
// async tag means: inside this function is an async stuff
exports.createStore = async (req, res) => {
  req.body.author = req.user._id;
  // waiting for the promise to be able to access slug, see below
  const store = await (new Store(req.body)).save();
  req.flash('success', `Successfully created ${store.name}. Care to leave a review?`);
  res.redirect(`/store/${store.slug}`);
};

exports.getStores = async (req, res) => {
  const stores = await Store.find();
  res.render('stores', { title: 'Stores', stores });
};

const confirmOwner = (store, user) => {
  if (!store.author.equals(user._id)) { // equals: to compare ObjectId type values
    throw Error('You must own a store in order to edit it!');
  }
};

exports.editStore = async (req, res) => {
  // 1 find the store for the given ID
  const store = await Store.findOne({ _id: req.params.id });
  // 2 confirm they are the owner of the store
  confirmOwner(store, req.user);
  // 3 reder out the edit form so the user can update thier store
  res.render('editStore', { title: `Edit ${store.name}`, store });
};

exports.updateStore = async (req, res) => {
  // set the location data to be Point (important to find places nearby)
  req.body.location.type = "Point";
  // find and update the store
  const store = await Store.findOneAndUpdate({ _id: req.params.id }, req.body, {
    new: true, // return the new Store instead of the old one
    runValidators: true
  }).exec();
  req.flash('success', `Successfully update ${store.name}. <a href="/stores/${store.slug}">View store</a>`);
  res.redirect(`/stores/${store._id}/edit`);
  // redirected them to the store, and tell them it worked
};

exports.getStoreBySlug = async (req, res, next) => {
  const store = await Store
    .findOne({ slug: req.params.slug })
    .populate('author'); // populating author field, as it's only a reference to user _id
  if (!store) {
    next(); // will pass control to the next middleware, which is not found error
    return;
  }
  res.render('store', { store, title: store.name });
};

exports.getStoresByTag = async (req, res) => {
  const activeTag = req.params.tag;
  // $exists: fallback to a propperty on an item,
  // where this property exists
  const tagQuery = activeTag || { $exists: true };
  const tagsPromise = Store.getTagsList();
  const storesPromise = Store.find({ tags: tagQuery });
  // [ ...  ] : destructuring
  const [tags, stores] = await Promise.all([tagsPromise, storesPromise]);
  res.render('tags', { tags, activeTag, stores, title: 'Tags' });
};

exports.searchStores = async (req, res) => {
  const stores = await Store
  .find({
    $text: { // search for fields, wich are indexed as 'text' 
      $search: req.query.q
    }
  }, {
    score: { $meta: 'textScore' } // adding an extra field to the stores, showing the search relevance
  })
  .sort({
    score: { $meta: 'textScore' }
  })
  .limit(5);
  res.json(stores);
};

exports.mapStores = async (req, res) => {
  const coordinates = [req.query.lng, req.query.lat].map(parseFloat);
  const q = {
    location: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates
        },
        $maxDistance: 10000 // 10 km
      }
    }
  };

  const stores = await Store
    .find(q)
    .select('slug name description location photo')
    .limit(10); // select fields
  res.json(stores);
};

exports.mapPage = (req, res) => {
  res.render('map', { title: 'Map' });
}

// to heart / unheart a store
exports.heartStore = async (req, res) => {
  const hearts = req.user.hearts.map(obj => obj.toString());
  // $pull: remove from DB
  // $addToSet: ads a unique element to the DB - $push would ignore it, and would at it multiple times
  const mongoDBoperator = hearts.includes(req.params.id) ? '$pull' : '$addToSet';
  const user = await User
    .findByIdAndUpdate(req.user._id,
      { [mongoDBoperator]: { hearts: req.params.id } }, // computed property: ES6 feature
      { new: true } // with this it will return the updated user
  );
  res.json(user);
};
