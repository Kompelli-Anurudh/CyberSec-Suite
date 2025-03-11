from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import rsa, padding
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
import base64
import os
import json
import logging
from datetime import datetime
import tkinter as tk
from tkinter import filedialog, messagebox
import shutil

class EncryptionToolkit:
    def __init__(self, log_file="encryption_toolkit.log"):
        """Initialize the encryption toolkit with logging capabilities"""
        logging.basicConfig(
            filename=log_file,
            level=logging.INFO,
            format='%(asctime)s - %(levelname)s - %(message)s'
        )
        self.logger = logging.getLogger(__name__)

    def generate_key_pair(self, key_size=2048):
        """Generate RSA key pair for asymmetric encryption"""
        try:
            private_key = rsa.generate_private_key(
                public_exponent=65537,
                key_size=key_size
            )
            public_key = private_key.public_key()
            
            return {
                'private_key': private_key,
                'public_key': public_key
            }
        except Exception as e:
            self.logger.error(f"Key pair generation failed: {str(e)}")
            raise

    def save_key_pair(self, key_pair, private_key_path, public_key_path):
        """Save RSA key pair to files"""
        try:
            # Save private key
            private_pem = key_pair['private_key'].private_bytes(
                encoding=serialization.Encoding.PEM,
                format=serialization.PrivateFormat.PKCS8,
                encryption_algorithm=serialization.NoEncryption()
            )
            with open(private_key_path, 'wb') as f:
                f.write(private_pem)

            # Save public key
            public_pem = key_pair['public_key'].public_bytes(
                encoding=serialization.Encoding.PEM,
                format=serialization.PublicFormat.SubjectPublicKeyInfo
            )
            with open(public_key_path, 'wb') as f:
                f.write(public_pem)
                
            self.logger.info("Key pair saved successfully")
        except Exception as e:
            self.logger.error(f"Failed to save key pair: {str(e)}")
            raise

    def load_key_pair(self, private_key_path, public_key_path):
        """Load RSA key pair from files"""
        try:
            # Load private key
            with open(private_key_path, 'rb') as f:
                private_key = serialization.load_pem_private_key(
                    f.read(),
                    password=None
                )

            # Load public key
            with open(public_key_path, 'rb') as f:
                public_key = serialization.load_pem_public_key(f.read())

            return {
                'private_key': private_key,
                'public_key': public_key
            }
        except Exception as e:
            self.logger.error(f"Failed to load key pair: {str(e)}")
            raise

    def generate_symmetric_key(self):
        """Generate a key for symmetric encryption using Fernet"""
        try:
            key = Fernet.generate_key()
            self.logger.info("Symmetric key generated successfully")
            return key
        except Exception as e:
            self.logger.error(f"Symmetric key generation failed: {str(e)}")
            raise

    def generate_key_from_password(self, password):
        """Generate a Fernet key from a password"""
        salt = b'salt_123'  # In production, use a random salt and store it with the file
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=salt,
            iterations=100000,
        )
        key = base64.urlsafe_b64encode(kdf.derive(password.encode()))
        return key

    def encrypt_file_symmetric(self, file_path, password, output_path=None):
        """Encrypt a file using password-based encryption"""
        try:
            if output_path is None:
                output_path = file_path  # Use the same file path

            key = self.generate_key_from_password(password)
            fernet = Fernet(key)
            
            with open(file_path, 'rb') as f:
                file_data = f.read()
            
            encrypted_data = fernet.encrypt(file_data)
            
            with open(output_path, 'wb') as f:
                f.write(encrypted_data)
            
            self.logger.info(f"File encrypted successfully: {output_path}")
            return output_path
        except Exception as e:
            self.logger.error(f"File encryption failed: {str(e)}")
            raise

    def decrypt_file_symmetric(self, file_path, password, output_path=None):
        """Decrypt a file using password-based encryption"""
        try:
            if output_path is None:
                output_path = file_path  # Use the same file path

            key = self.generate_key_from_password(password)
            fernet = Fernet(key)
            
            with open(file_path, 'rb') as f:
                encrypted_data = f.read()
            
            decrypted_data = fernet.decrypt(encrypted_data)
            
            with open(output_path, 'wb') as f:
                f.write(decrypted_data)
            
            self.logger.info(f"File decrypted successfully: {output_path}")
            return output_path
        except Exception as e:
            self.logger.error(f"File decryption failed: {str(e)}")
            raise

    def encrypt_data_asymmetric(self, data, public_key):
        """Encrypt data using asymmetric encryption"""
        try:
            encrypted = public_key.encrypt(
                data.encode(),
                padding.OAEP(
                    mgf=padding.MGF1(algorithm=hashes.SHA256()),
                    algorithm=hashes.SHA256(),
                    label=None
                )
            )
            return base64.b64encode(encrypted).decode()
        except Exception as e:
            self.logger.error(f"Asymmetric encryption failed: {str(e)}")
            raise

    def decrypt_data_asymmetric(self, encrypted_data, private_key):
        """Decrypt data using asymmetric encryption"""
        try:
            decrypted = private_key.decrypt(
                base64.b64decode(encrypted_data),
                padding.OAEP(
                    mgf=padding.MGF1(algorithm=hashes.SHA256()),
                    algorithm=hashes.SHA256(),
                    label=None
                )
            )
            return decrypted.decode()
        except Exception as e:
            self.logger.error(f"Asymmetric decryption failed: {str(e)}")
            raise

    def create_digital_signature(self, data, private_key):
        """Create a digital signature for data"""
        try:
            signature = private_key.sign(
                data.encode(),
                padding.PSS(
                    mgf=padding.MGF1(hashes.SHA256()),
                    salt_length=padding.PSS.MAX_LENGTH
                ),
                hashes.SHA256()
            )
            return base64.b64encode(signature).decode()
        except Exception as e:
            self.logger.error(f"Digital signature creation failed: {str(e)}")
            raise

    def verify_digital_signature(self, data, signature, public_key):
        """Verify a digital signature"""
        try:
            public_key.verify(
                base64.b64decode(signature),
                data.encode(),
                padding.PSS(
                    mgf=padding.MGF1(hashes.SHA256()),
                    salt_length=padding.PSS.MAX_LENGTH
                ),
                hashes.SHA256()
            )
            self.logger.info("Digital signature verified successfully")
            return True
        except Exception as e:
            self.logger.error(f"Digital signature verification failed: {str(e)}")
            return False

    def encrypt_folder_symmetric(self, folder_path, password):
        """Encrypt all files in a folder recursively"""
        try:
            # Walk through all files in the folder
            for root, dirs, files in os.walk(folder_path):
                for file in files:
                    file_path = os.path.join(root, file)
                    try:
                        self.encrypt_file_symmetric(file_path, password)
                        self.logger.info(f"Encrypted file: {file_path}")
                    except Exception as e:
                        self.logger.error(f"Failed to encrypt {file_path}: {str(e)}")
            
            self.logger.info(f"Folder encrypted successfully: {folder_path}")
            return folder_path
        except Exception as e:
            self.logger.error(f"Folder encryption failed: {str(e)}")
            raise

    def decrypt_folder_symmetric(self, folder_path, password):
        """Decrypt all files in a folder recursively"""
        try:
            # Walk through all files in the folder
            for root, dirs, files in os.walk(folder_path):
                for file in files:
                    file_path = os.path.join(root, file)
                    try:
                        self.decrypt_file_symmetric(file_path, password)
                        self.logger.info(f"Decrypted file: {file_path}")
                    except Exception as e:
                        self.logger.error(f"Failed to decrypt {file_path}: {str(e)}")
            
            self.logger.info(f"Folder decrypted successfully: {folder_path}")
            return folder_path
        except Exception as e:
            self.logger.error(f"Folder decryption failed: {str(e)}")
            raise

def main():
    def encrypt_file():
        file_path = filedialog.askopenfilename(title="Select file to encrypt")
        if file_path:
            password = tk.simpledialog.askstring("Password", "Enter encryption password:", show='*')
            if password:
                try:
                    toolkit.encrypt_file_symmetric(file_path, password)
                    file_status_label.config(text=f"Success: File encrypted!", fg="green")
                except Exception as e:
                    file_status_label.config(text=f"Error: {str(e)}", fg="red")

    def decrypt_file():
        file_path = filedialog.askopenfilename(title="Select file to decrypt")
        if file_path:
            password = tk.simpledialog.askstring("Password", "Enter decryption password:", show='*')
            if password:
                try:
                    toolkit.decrypt_file_symmetric(file_path, password)
                    file_status_label.config(text=f"Success: File decrypted!", fg="green")
                except Exception as e:
                    file_status_label.config(text=f"Error: {str(e)}", fg="red")

    def encrypt_folder():
        folder_path = filedialog.askdirectory(title="Select folder to encrypt")
        if folder_path:
            password = tk.simpledialog.askstring("Password", "Enter encryption password:", show='*')
            if password:
                try:
                    toolkit.encrypt_folder_symmetric(folder_path, password)
                    folder_status_label.config(text=f"Success: Folder encrypted!", fg="green")
                except Exception as e:
                    folder_status_label.config(text=f"Error: {str(e)}", fg="red")

    def decrypt_folder():
        folder_path = filedialog.askdirectory(title="Select folder to decrypt")
        if folder_path:
            password = tk.simpledialog.askstring("Password", "Enter decryption password:", show='*')
            if password:
                try:
                    toolkit.decrypt_folder_symmetric(folder_path, password)
                    folder_status_label.config(text=f"Success: Folder decrypted!", fg="green")
                except Exception as e:
                    folder_status_label.config(text=f"Error: {str(e)}", fg="red")

    # Create main window
    root = tk.Tk()
    root.title("File & Folder Encryption Tool")
    root.geometry("500x600")
    root.configure(bg='#f0f0f0')
    
    # Initialize toolkit
    toolkit = EncryptionToolkit()

    # Style configuration
    style = {
        'bg': '#f0f0f0',
        'frame_bg': '#ffffff',
        'button_bg': '#4a90e2',
        'button_fg': 'white',
        'label_fg': '#333333',
        'pady': 10,
        'padx': 15
    }
    
    # Title
    title_label = tk.Label(root, text="Encryption Tool", font=("Helvetica", 16, "bold"), 
                          bg=style['bg'], fg=style['label_fg'])
    title_label.pack(pady=20)

    # File Operations Frame
    file_frame = tk.LabelFrame(root, text="File Operations", font=("Helvetica", 10, "bold"),
                              bg=style['frame_bg'], padx=style['padx'], pady=style['pady'])
    file_frame.pack(padx=20, pady=10, fill="x")

    # File Buttons
    tk.Button(file_frame, text="Encrypt File", command=encrypt_file,
              bg=style['button_bg'], fg=style['button_fg'],
              width=20).pack(pady=5)
    tk.Button(file_frame, text="Decrypt File", command=decrypt_file,
              bg=style['button_bg'], fg=style['button_fg'],
              width=20).pack(pady=5)
    
    # File Status Label
    file_status_label = tk.Label(file_frame, text="", bg=style['frame_bg'])
    file_status_label.pack(pady=5)

    # Folder Operations Frame
    folder_frame = tk.LabelFrame(root, text="Folder Operations", font=("Helvetica", 10, "bold"),
                                bg=style['frame_bg'], padx=style['padx'], pady=style['pady'])
    folder_frame.pack(padx=20, pady=10, fill="x")

    # Folder Buttons
    tk.Button(folder_frame, text="Encrypt Folder", command=encrypt_folder,
              bg=style['button_bg'], fg=style['button_fg'],
              width=20).pack(pady=5)
    tk.Button(folder_frame, text="Decrypt Folder", command=decrypt_folder,
              bg=style['button_bg'], fg=style['button_fg'],
              width=20).pack(pady=5)
    
    # Folder Status Label
    folder_status_label = tk.Label(folder_frame, text="", bg=style['frame_bg'])
    folder_status_label.pack(pady=5)

    # Exit Button Frame
    exit_frame = tk.Frame(root, bg=style['bg'])
    exit_frame.pack(pady=20)

    tk.Button(exit_frame, text="Exit", command=root.destroy,
              bg='#e74c3c', fg='white',
              width=20).pack()

    root.mainloop()

if __name__ == "__main__":
    main()