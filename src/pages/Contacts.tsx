import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  InputAdornment,
  IconButton,
  Menu,
  MenuItem,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  CircularProgress,
  Alert,
  Grid,
  useMediaQuery,
  useTheme,
  Card,
  CardContent,
  Divider,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Search as SearchIcon,
  Download as DownloadIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  FilterList as FilterIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
  Business as BusinessIcon,
} from '@mui/icons-material';
import { contactService } from '../services/contact.service';
import { formatDate, formatContactCategory, formatPhoneNumber } from '../utils/format';
import { Contact, ContactCategory } from '../types';
import ContactForm from '../components/contacts/ContactForm';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import ContactBulkImport from '../components/contacts/ContactBulkImport';
import ContactExportModal from '../components/contacts/ContactExportModal';

const Contacts: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // State for contacts
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [totalContacts, setTotalContacts] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exportOpen, setExportOpen] = useState(false);

  // State for pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // State for search and filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ContactCategory | 'ALL'>('ALL');
  const [sortBy, setSortBy] = useState<string>('fullName');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [lastContactedBefore, setLastContactedBefore] = useState<Date | null>(null);
  const [lastContactedAfter, setLastContactedAfter] = useState<Date | null>(null);
  const [importSuccess, setImportSuccess] = useState<{ imported: number; failed: number } | null>(null);

  // State for form modal
  const [formOpen, setFormOpen] = useState(false);
  const [currentContact, setCurrentContact] = useState<Contact | null>(null);

  // State for delete confirmation
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [contactToDelete, setContactToDelete] = useState<Contact | null>(null);

  // Filter menu
  const [filterAnchorEl, setFilterAnchorEl] = useState<null | HTMLElement>(null);
  const filterMenuOpen = Boolean(filterAnchorEl);

  // Fetch contacts from the API
  const fetchContacts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Pass all pagination params to the API
      const params = {
        search: searchTerm || undefined,
        skip: page * rowsPerPage,
        take: rowsPerPage,
        category: selectedCategory !== 'ALL' ? selectedCategory : undefined,
        sortBy,
        sortOrder: sortDirection
      };

      const result = await contactService.getContacts(params);

      console.log('API response:', result);

      if (result && Array.isArray(result.contacts)) {
        setContacts(result.contacts);
        setTotalContacts(result.total);
      } else {
        console.error('Invalid contacts data received:', result);
        setContacts([]);
        setTotalContacts(0);
      }
    } catch (error) {
      console.error('Failed to fetch contacts:', error);
      setError('Failed to load contacts. Please try again.');
      setContacts([]);
      setTotalContacts(0);
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, searchTerm, selectedCategory, sortBy, sortDirection]);

  // Load contacts whenever any parameter changes
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchContacts();
    }, 500);

    return () => clearTimeout(timer);
  }, [fetchContacts]);

  // Handle page change
  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  // Handle rows per page change
  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Handle sort change
  const handleSortChange = (field: string) => {
    if (field === sortBy) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDirection('asc');
    }
    // Reset to first page when changing sort
    setPage(0);
  };

  // Handle category filter
  const handleCategoryFilter = (category: ContactCategory | 'ALL') => {
    setSelectedCategory(category);
    setPage(0); // Reset to first page when changing filters
  };

  // Handle filter menu
  const handleFilterClick = (event: React.MouseEvent<HTMLElement>) => {
    setFilterAnchorEl(event.currentTarget);
  };

  const handleFilterClose = () => {
    setFilterAnchorEl(null);
  };

  // Handle form open/close
  const handleFormOpen = (contact: Contact | null = null) => {
    setCurrentContact(contact);
    setFormOpen(true);
  };

  const handleFormClose = (refreshData: boolean = false) => {
    setFormOpen(false);
    setCurrentContact(null);
    if (refreshData) {
      fetchContacts();
    }
  };

  // Handle delete dialog
  const handleDeleteDialogOpen = (contact: Contact) => {
    setContactToDelete(contact);
    setDeleteDialogOpen(true);
  };

  const handleDeleteDialogClose = () => {
    setDeleteDialogOpen(false);
    setContactToDelete(null);
  };

  // Delete contact
  const handleDeleteContact = async () => {
    if (!contactToDelete) return;

    try {
      await contactService.deleteContact(contactToDelete.id);
      fetchContacts();
      handleDeleteDialogClose();
    } catch (error) {
      console.error('Failed to delete contact:', error);
      setError('Failed to delete contact. Please try again.');
    }
  };

  // Handle import complete
  const handleImportComplete = (result: { imported: number; failed: number }) => {
    setImportSuccess(result);

    // Refresh contacts list
    fetchContacts();

    // Clear success message after 5 seconds
    setTimeout(() => {
      setImportSuccess(null);
    }, 5000);
  };

  // Categories for filter
  const categories: { value: ContactCategory | 'ALL'; label: string }[] = [
    { value: 'ALL', label: 'All Contacts' },
    { value: 'HOTLIST', label: 'Hot List' },
    { value: 'A_LIST', label: 'A List' },
    { value: 'B_LIST', label: 'B List' },
    { value: 'C_LIST', label: 'C List' },
    { value: 'STANDARD', label: 'Standard' },
  ];

  // Render contact card for mobile view
  const renderContactCard = (contact: Contact) => (
    <Card key={contact.id} sx={{ mb: 2 }}>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
          <Typography variant="h6" component="div">
            {contact.fullName}
          </Typography>
          <Chip
            label={formatContactCategory(contact.category)}
            size="small"
            color={
              contact.category === 'HOTLIST' ? 'error' :
                contact.category === 'A_LIST' ? 'primary' :
                  contact.category === 'B_LIST' ? 'secondary' :
                    contact.category === 'C_LIST' ? 'info' : 'default'
            }
          />
        </Box>

        {contact.jobTitle && contact.company && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            <BusinessIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
            {contact.jobTitle} at {contact.company}
          </Typography>
        )}

        {contact.phone && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            <PhoneIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
            {formatPhoneNumber(contact.phone)}
          </Typography>
        )}

        {contact.email && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            <EmailIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
            {contact.email}
          </Typography>
        )}

        <Typography variant="caption" display="block" sx={{ mt: 1 }}>
          Last contacted: {contact.lastContacted ? formatDate(contact.lastContacted) : 'Never'}
        </Typography>

        <Divider sx={{ my: 1 }} />

        <Box display="flex" justifyContent="flex-end" gap={1}>
          <IconButton
            size="small"
            color="primary"
            onClick={() => handleFormOpen(contact)}
          >
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            color="error"
            onClick={() => handleDeleteDialogOpen(contact)}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
          <Button
            size="small"
            variant="outlined"
            onClick={() => navigate(`/contacts/${contact.id}`)}
          >
            View
          </Button>
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Contacts</Typography>
        <Box display="flex" gap={1}>
          <Button
            variant="outlined"
            color="primary"
            startIcon={<DownloadIcon />}
            onClick={() => setExportOpen(true)}
          >
            Export Contacts
          </Button>
          <ContactBulkImport onImportComplete={handleImportComplete} />
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => handleFormOpen()}
          >
            Add Contact
          </Button>
        </Box>
      </Box>

      {importSuccess && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setImportSuccess(null)}>
          Successfully imported {importSuccess.imported} contacts. {importSuccess.failed > 0 && `Failed to import ${importSuccess.failed} contacts.`}
        </Alert>
      )}

      {loading ? (
        <Box display="flex" justifyContent="center" my={4}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {error ? (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          ) : (
            <Paper sx={{ mb: 3 }}>
              <Box p={2}>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Search Contacts"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search by name, email, phone..."
                      variant="outlined"
                      size="small"
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <SearchIcon />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Box display="flex" gap={1} flexWrap="wrap">
                      <Button
                        variant={selectedCategory === 'ALL' ? 'contained' : 'outlined'}
                        size="small"
                        onClick={() => handleCategoryFilter('ALL')}
                      >
                        ALL
                      </Button>
                      <Button
                        variant={selectedCategory === 'HOTLIST' ? 'contained' : 'outlined'}
                        size="small"
                        color="error"
                        onClick={() => handleCategoryFilter('HOTLIST')}
                      >
                        HOT LIST
                      </Button>
                      <Button
                        variant={selectedCategory === 'A_LIST' ? 'contained' : 'outlined'}
                        size="small"
                        color="primary"
                        onClick={() => handleCategoryFilter('A_LIST')}
                      >
                        A LIST
                      </Button>
                      <Button
                        variant={selectedCategory === 'B_LIST' ? 'contained' : 'outlined'}
                        size="small"
                        color="secondary"
                        onClick={() => handleCategoryFilter('B_LIST')}
                      >
                        B LIST
                      </Button>
                      <Button
                        variant={selectedCategory === 'C_LIST' ? 'contained' : 'outlined'}
                        size="small"
                        color="info"
                        onClick={() => handleCategoryFilter('C_LIST')}
                      >
                        C LIST
                      </Button>
                    </Box>
                  </Grid>
                </Grid>
              </Box>
            </Paper>
          )}

          {/* Contacts data */}
          {!loading && contacts.length === 0 && totalContacts === 0 ? (
            <Alert severity="info" sx={{ mb: 3 }}>
              {searchTerm ?
                `No contacts found matching "${searchTerm}"` :
                selectedCategory !== 'ALL' ?
                  `No contacts found in ${formatContactCategory(selectedCategory)} category` :
                  'No contacts found. Add a new contact to get started.'
              }
            </Alert>
          ) : !loading && (
            <>
              {isMobile ? (
                // Mobile view: cards
                <Box>
                  {contacts.map(contact => renderContactCard(contact))}

                  {/* Mobile pagination */}
                  {totalContacts > 0 && (
                    <Box display="flex" justifyContent="center" mt={2}>
                      <TablePagination
                        rowsPerPageOptions={[5, 10, 25, 50]}
                        component="div"
                        count={totalContacts}
                        rowsPerPage={rowsPerPage}
                        page={page}
                        onPageChange={handleChangePage}
                        onRowsPerPageChange={handleChangeRowsPerPage}
                      />
                    </Box>
                  )}
                </Box>
              ) : (
                // Desktop view: table
                <Paper>
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell
                            sortDirection={sortBy === 'fullName' ? sortDirection : false}
                            onClick={() => handleSortChange('fullName')}
                            sx={{ cursor: 'pointer' }}
                          >
                            Name
                            {sortBy === 'fullName' && (
                              sortDirection === 'asc' ? ' ↑' : ' ↓'
                            )}
                          </TableCell>
                          <TableCell
                            sortDirection={sortBy === 'category' ? sortDirection : false}
                            onClick={() => handleSortChange('category')}
                            sx={{ cursor: 'pointer' }}
                          >
                            Category
                            {sortBy === 'category' && (
                              sortDirection === 'asc' ? ' ↑' : ' ↓'
                            )}
                          </TableCell>
                          <TableCell>Phone</TableCell>
                          <TableCell>Email</TableCell>
                          <TableCell
                            sortDirection={sortBy === 'lastContacted' ? sortDirection : false}
                            onClick={() => handleSortChange('lastContacted')}
                            sx={{ cursor: 'pointer' }}
                          >
                            Last Contacted
                            {sortBy === 'lastContacted' && (
                              sortDirection === 'asc' ? ' ↑' : ' ↓'
                            )}
                          </TableCell>
                          <TableCell
                            sortDirection={sortBy === 'nextContactDate' ? sortDirection : false}
                            onClick={() => handleSortChange('nextContactDate')}
                            sx={{ cursor: 'pointer' }}
                          >
                            Next Follow-up
                            {sortBy === 'nextContactDate' && (
                              sortDirection === 'asc' ? ' ↑' : ' ↓'
                            )}
                          </TableCell>
                          <TableCell align="center">Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {contacts.map((contact) => (
                          <TableRow
                            key={contact.id}
                            hover
                            onClick={() => navigate(`/contacts/${contact.id}`)}
                            sx={{ cursor: 'pointer' }}
                          >
                            <TableCell>{contact.fullName}</TableCell>
                            <TableCell>
                              <Chip
                                label={formatContactCategory(contact.category)}
                                size="small"
                                color={
                                  contact.category === 'HOTLIST' ? 'error' :
                                    contact.category === 'A_LIST' ? 'primary' :
                                      contact.category === 'B_LIST' ? 'secondary' :
                                        contact.category === 'C_LIST' ? 'info' : 'default'
                                }
                              />
                            </TableCell>
                            <TableCell>{formatPhoneNumber(contact.phone)}</TableCell>
                            <TableCell>{contact.email}</TableCell>
                            <TableCell>
                              {contact.lastContacted ? formatDate(contact.lastContacted) : 'Never'}
                            </TableCell>
                            <TableCell>
                              {contact.nextContactDate ? formatDate(contact.nextContactDate) : 'N/A'}
                            </TableCell>
                            <TableCell align="right">
                              <Box
                                onClick={(e) => e.stopPropagation()}
                                display="flex"
                                justifyContent="flex-end"
                                gap={1}
                              >
                                <IconButton
                                  size="small"
                                  color="primary"
                                  onClick={() => handleFormOpen(contact)}
                                >
                                  <EditIcon fontSize="small" />
                                </IconButton>
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => handleDeleteDialogOpen(contact)}
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Box>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                  <TablePagination
                    rowsPerPageOptions={[5, 10, 25, 50]}
                    component="div"
                    count={totalContacts}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={handleChangePage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                  />
                </Paper>
              )}
            </>
          )}
        </>
      )}

      {/* Contact form dialog */}
      {formOpen && (
        <ContactForm
          open={formOpen}
          contact={currentContact}
          onClose={handleFormClose}
        />
      )}

      {/* Delete confirmation dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteDialogClose}
      >
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete {contactToDelete?.fullName}? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteDialogClose}>Cancel</Button>
          <Button onClick={handleDeleteContact} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
      <ContactExportModal open={exportOpen} onClose={() => setExportOpen(false)} />
    </Box>
  );
};

export default Contacts; 
