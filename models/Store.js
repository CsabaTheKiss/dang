const mongoose = require('mongoose');
mongoose.Promise = global.Promise;
const slug = require('slugs');

// strict schema: anything extra sent beside the below fields will be thrown away
const storeSchema = new mongoose.Schema({
    name: {
        type: String,
        trim: true,
        required: 'Please enter a store name!'
    },
    slug: String,
    description: {
        type: String,
        trim: true
    },
    tags: [String], // Array of strings
    created: {
        type: Date,
        default: Date.now
    },
    location: {
        type: {
            type: String,
            default: 'Point'
        },
        coordinates: [{
            type: Number,
            required: 'You must supply coordinates!'
        }],
        address: {
            type: String,
            required: 'You must supply an address!'
        }
    },
    photo: String,
    author: {
        type: mongoose.Schema.ObjectId,
        ref: 'User', // reference the User
        requiered: 'You must supply an author'
    }
});

// runs before saving an entry
storeSchema.pre('save', async function(next) {
    if (!this.isModified('name')) {
        next(); // skip it
        return; // stop this function from running
    }
    this.slug = slug(this.name);
    // find other stores that have a slug of was, was-1, was-2 etc.
    const slugRegEx = new RegExp(`^(${this.slug})((-[0-9]*$)?)$`, 'i');
    const storesWithSlug = await this.constructor.find({ slug: slugRegEx });
    if (storesWithSlug.length) {
        this.slug = `${this.slug}-${storesWithSlug.length + 1}`;
    }
    next();
    // TODO Make more resiliant as slugs are unique
});

// custom function on our schema
storeSchema.statics.getTagsList = function() {
    return this.aggregate([
        // $tags: starting with dollar, indicating that it's a field in our DB
        { $unwind: '$tags' },
        // grouping tags, adding new field 'count1 to sum it up
        { $group: { _id: '$tags', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
    ]);
};

module.exports = mongoose.model('Store', storeSchema);