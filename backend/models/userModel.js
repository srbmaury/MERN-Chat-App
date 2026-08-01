const mongoose = require("mongoose");
const bcrypt = require('bcryptjs');

const userSchema = mongoose.Schema(
    {
        name: { type: String, required: true, trim: true, maxlength: 100 },
        email: { type: String, required: true, unique: true, lowercase: true, trim: true },
        password: { type: String, required: true },
        pic: {
            type: String,
            default:
                "https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg",
        },
        isEmailVerified: { type: Boolean, default: false },
        verificationToken: { type: String, index: true },
        verificationTokenExpiresAt: { type: Date, index: true },
        fouls: { type: Number, default: 0 },
        blocked: { type: Boolean, default: false },
        submittedForReview: [
            { type: String },
        ],
        isAdmin: { type: Boolean, default: false },
        isBot: { type: Boolean, default: false, immutable: true },
        botKey: { type: String, unique: true, sparse: true, immutable: true },
    },
    { timestamps: true }
);

userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
}

userSchema.pre('save', async function () {
    if (!this.isModified('password')) return;

    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
})

const User = mongoose.model("User", userSchema);

module.exports = User;
