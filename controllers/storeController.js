const mongoose = require('mongoose');
const Store = mongoose.model('Store');
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
  // waiting for the promise to be able to access slug, see below
  const store = await (new Store(req.body)).save();
  req.flash('success', `Successfully created ${store.name}. Care to leave a review?`);
  res.redirect(`/store/${store.slug}`);
};

exports.getStores = async (req, res) => {
  const stores = await Store.find();
  res.render('stores', { title: 'Stores', stores });
};

exports.editStore = async (req, res) => {
  // 1 find the store for the given ID
  const store = await Store.findOne({ _id: req.params.id });
  // 2 confirm they are the owner of the store
  // TODO
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
  const store = await Store.findOne({ slug: req.params.slug });
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
