const mongoose = require("mongoose");
const bcrypt = require('bcryptjs');

const userSchema = mongoose.Schema(
    {
        name: { type: String, required: true },
        email: { type: String, required: true, unique: true },
        password: { type: String, required: true },
        pic: {
            type: String,
            default:
                "https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg",
        },
        isEmailVerified: { type: Boolean, default: false },
        verificationToken: { type: String },
        fouls: { type: Number, default: 0 },
        blocked: { type: Boolean, default: false },
        submittedForReview: [
            { type: String },
        ],
        isAdmin: { type: Boolean, default: false },
    },
    { timestamps: true }
);

userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
}

userSchema.pre('save', async function (next) {
    if (!this.isModified) {
        next();
    }
    if (this.createdAt === this.updatedAt) {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
    }
})

const User = mongoose.model("User", userSchema);

module.exports = User;