import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';

export async function checkPasswordAgainstHash(password: string, hash: string, salt?: string): Promise<boolean> {
    // Method 1: Direct bcrypt compare
    try {
        if (await bcrypt.compare(password, hash)) {
            return true;
        }
    } catch (error) {
        console.error('Bcrypt compare error:', error.message);
    }

    // Method 2: SHA-256 with salt
    if (salt) {
        try {
            const hashCheck = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha256').toString('hex');
            if (hashCheck === hash) {
                return true;
            }
        } catch (error) {
            console.error('SHA-256 compare error:', error.message);
        }
    }

    // Method 3: Simple SHA-256 (PayloadCMS might use this)
    try {
        const hashedPassword = crypto
            .createHash('sha256')
            .update(password + (salt || ''))
            .digest('hex');

        if (hashedPassword === hash) {
            return true;
        }
    } catch (error) {
        console.error('Simple SHA-256 error:', error.message);
    }

    return false;
}

export function isPayloadCmsBcryptHash(hash: string): boolean {
    // PayloadCMS uses bcrypt which starts with $2a$ or $2b$
    return hash.startsWith('$2a$') || hash.startsWith('$2b$');
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
    try {
        // Fix bcrypt hash prefix if needed
        let fixedHash = hash;
        if (fixedHash.startsWith('$2a$')) {
            fixedHash = fixedHash.replace('$2a$', '$2b$');
        }

        return await bcrypt.compare(password, fixedHash);
    } catch (error) {
        console.error('Error verifying password:', error);
        return false;
    }
} 