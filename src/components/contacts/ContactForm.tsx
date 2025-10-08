import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Grid,
  FormControl,
  InputLabel,
  Select,
  FormHelperText,
  CircularProgress,
  Alert,
} from '@mui/material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { Contact, ContactCategory } from '../../types';
import api from '../../services/api';
import { formatContactCategory } from '../../utils/format';
import { contactService } from '../../services/contact.service';

interface ContactFormProps {
  open: boolean;
  contact: Contact | null;
  onClose: (refreshData?: boolean) => void;
}

const ContactForm: React.FC<ContactFormProps> = ({ open, contact, onClose }) => {
  const [error, setError] = useState<string | null>(null);
  
  const initialValues: Partial<Contact> = {
    fullName: contact?.fullName || '',
    spouseFullName: contact?.spouseFullName || '',
    spouseEmail: contact?.spouseEmail || '',
    spousePhone: contact?.spousePhone || '',
    email: contact?.email || '',
    phone: contact?.phone || '',
    address: contact?.address || '',
    company: contact?.company || '',
    jobTitle: contact?.jobTitle || '',
    notes: contact?.notes || '',
    category: contact?.category || 'STANDARD',
  };
  
  const validationSchema = Yup.object({
    fullName: Yup.string().required('Full name is required'),
    spouseEmail: Yup.string()
      .when('spouseFullName', {
        is: (spouseFullName: string) => spouseFullName && spouseFullName.trim().length > 0,
        then: (schema) => schema.email('Invalid email address').required('Spouse email is required when spouse name is provided'),
        otherwise: (schema) => schema.email('Invalid email address').optional(),
      }),
    spousePhone: Yup.string()
      .when('spouseFullName', {
        is: (spouseFullName: string) => spouseFullName && spouseFullName.trim().length > 0,
        then: (schema) => schema
          .required('Spouse phone is required when spouse name is provided')
          .matches(
            /^(\+\d{1,3}( )?)?((\(\d{1,3}\))|\d{1,3})[- .]?\d{3,4}[- .]?\d{4}$/,
            'Invalid phone number format'
          ),
        otherwise: (schema) => schema
          .optional()
          .matches(
            /^(\+\d{1,3}( )?)?((\(\d{1,3}\))|\d{1,3})[- .]?\d{3,4}[- .]?\d{4}$/,
            'Invalid phone number format'
          ),
      }),
    email: Yup.string().email('Invalid email address').required('Email is required'),
    phone: Yup.string()
      .required('Phone number is required')
      .matches(
        /^(\+\d{1,3}( )?)?((\(\d{1,3}\))|\d{1,3})[- .]?\d{3,4}[- .]?\d{4}$/,
        'Invalid phone number format'
      ),
    category: Yup.string().required('Category is required'),
  });
  
  const formik = useFormik({
    initialValues,
    validationSchema,
    onSubmit: async (values, { setSubmitting }) => {
      setError(null);
      try {
        let contactId;
        
        if (contact) {
          // Update existing contact
          await api.patch(`/contacts/${contact.id}`, values);
          contactId = contact.id;
        } else {
         
          const response = await api.post('/contacts', values);
          console.log('Contact creation response:', response);
          
          // Handle different possible response structures safely
          if (response.data) {
            if (response.data.data && response.data.data.id) {
              contactId = response.data.data.id;
            } else if (response.data.id) {
              contactId = response.data.id;
            }
          }
        }
        
        onClose(true); // Refresh data after successful operation
      } catch (error) {
        console.error('Failed to save contact:', error);
        setError(error instanceof Error ? error.message : 'Failed to save contact');
        setSubmitting(false);
      }
    },
  });
  
  const handleCancel = () => {
    onClose(false);
  };
  
  const categories: ContactCategory[] = ['HOTLIST', 'A_LIST', 'B_LIST', 'C_LIST', 'STANDARD'];
  
  return (
    <Dialog open={open} onClose={handleCancel} maxWidth="md" fullWidth>
      <form onSubmit={formik.handleSubmit}>
        <DialogTitle>{contact ? 'Edit Contact' : 'Add New Contact'}</DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                id="fullName"
                name="fullName"
                label="Full Name"
                value={formik.values.fullName}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.fullName && Boolean(formik.errors.fullName)}
                helperText={formik.touched.fullName && formik.errors.fullName}
              />
            </Grid>
            
           
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                id="email"
                name="email"
                label="Email"
                value={formik.values.email}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.email && Boolean(formik.errors.email)}
                helperText={formik.touched.email && formik.errors.email}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                id="phone"
                name="phone"
                label="Phone"
                value={formik.values.phone}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.phone && Boolean(formik.errors.phone)}
                helperText={formik.touched.phone && formik.errors.phone}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                id="spouseFullName"
                name="spouseFullName"
                label="Spouse Name (if applicable)"
                value={formik.values.spouseFullName}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.spouseFullName && Boolean(formik.errors.spouseFullName)}
                helperText={formik.touched.spouseFullName && formik.errors.spouseFullName}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                id="spouseEmail"
                name="spouseEmail"
                label="Spouse Email (if applicable)"
                value={formik.values.spouseEmail}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.spouseEmail && Boolean(formik.errors.spouseEmail)}
                helperText={formik.touched.spouseEmail && formik.errors.spouseEmail}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                id="spousePhone"
                name="spousePhone"
                label="Spouse Phone (if applicable)"
                value={formik.values.spousePhone}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.spousePhone && Boolean(formik.errors.spousePhone)}
                helperText={formik.touched.spousePhone && formik.errors.spousePhone}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                id="address"
                name="address"
                label="Address"
                value={formik.values.address}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.address && Boolean(formik.errors.address)}
                helperText={formik.touched.address && formik.errors.address}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                id="company"
                name="company"
                label="Company"
                value={formik.values.company}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.company && Boolean(formik.errors.company)}
                helperText={formik.touched.company && formik.errors.company}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                id="jobTitle"
                name="jobTitle"
                label="Job Title"
                value={formik.values.jobTitle}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.jobTitle && Boolean(formik.errors.jobTitle)}
                helperText={formik.touched.jobTitle && formik.errors.jobTitle}
              />
            </Grid>
            
            <Grid item xs={12}>
              <FormControl fullWidth error={formik.touched.category && Boolean(formik.errors.category)}>
                <InputLabel id="category-label">Category</InputLabel>
                <Select
                  labelId="category-label"
                  id="category"
                  name="category"
                  value={formik.values.category}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  label="Category"
                >
                  {categories.map((category) => (
                    <MenuItem key={category} value={category}>
                      {formatContactCategory(category)}
                    </MenuItem>
                  ))}
                </Select>
                {formik.touched.category && formik.errors.category && (
                  <FormHelperText>{formik.errors.category}</FormHelperText>
                )}
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                id="notes"
                name="notes"
                label="Notes"
                multiline
                rows={3}
                value={formik.values.notes}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.notes && Boolean(formik.errors.notes)}
                helperText={formik.touched.notes && formik.errors.notes}
                placeholder="Add any initial notes about this contact..."
              />
            </Grid>
           
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancel}>Cancel</Button>
          <Button 
            type="submit" 
            variant="contained" 
            color="primary"
            disabled={formik.isSubmitting}
          >
            {formik.isSubmitting ? (
              <CircularProgress size={24} />
            ) : contact ? (
              'Update Contact'
            ) : (
              'Add Contact'
            )}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default ContactForm; 
