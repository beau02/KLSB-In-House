import React, { useEffect, useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Alert,
  CircularProgress
} from '@mui/material';
import { overtimeRequestService } from '../services';

export const ReplacementLeaveHistoryPage = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [summary, setSummary] = useState({
    replacementLeaveBalanceHours: 0,
    replacementLeaveBalanceDays: 0,
    totalCreditedHours: 0,
    totalDebitedHours: 0
  });
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    fetchLeaveHistory();
  }, []);

  const fetchLeaveHistory = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await overtimeRequestService.getMyLeaveHistory({ limit: 100 });
      setSummary(response.summary || {
        replacementLeaveBalanceHours: 0,
        replacementLeaveBalanceDays: 0,
        totalCreditedHours: 0,
        totalDebitedHours: 0
      });
      setTransactions(response.transactions || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load replacement leave history');
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (value) => {
    if (!value) return '-';
    return new Date(value).toLocaleString('en-MY');
  };

  const formatSource = (transaction) => {
    if (transaction.sourceType === 'overtime_approval') {
      return 'OT Approval';
    }
    if (transaction.sourceType === 'leave_usage') {
      return 'Leave Usage';
    }
    return 'Manual Adjustment';
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
          Replacement Leave History
        </Typography>
        <Typography variant="body1" color="textSecondary">
          Track replacement leave credits, usage, and current balance
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 0.5 }}>
                Current Balance (Days)
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                {summary.replacementLeaveBalanceDays || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 0.5 }}>
                Total Hours
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                {summary.totalCreditedHours || 0}
              </Typography>
              <Typography variant="caption" color="textSecondary">
                Debited: {summary.totalDebitedHours || 0} hour(s)
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Source</TableCell>
                <TableCell align="right">Hours</TableCell>
                <TableCell align="right">Days</TableCell>
                <TableCell align="right">Balance (Hours)</TableCell>
                <TableCell align="right">Balance (Days)</TableCell>
                <TableCell>By</TableCell>
                <TableCell>Remarks</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} align="center">
                    <Box sx={{ py: 4 }}>
                      <CircularProgress size={28} />
                    </Box>
                  </TableCell>
                </TableRow>
              ) : transactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align="center">
                    <Typography color="textSecondary" sx={{ py: 3 }}>
                      No replacement leave transactions yet.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                transactions.map((tx) => (
                  <TableRow key={tx._id} hover>
                    <TableCell>
                      <Typography variant="body2">{formatDateTime(tx.createdAt)}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={tx.transactionType === 'credit' ? 'Credit' : 'Debit'}
                        color={tx.transactionType === 'credit' ? 'success' : 'warning'}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>{formatSource(tx)}</TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {tx.transactionType === 'credit' ? '+' : '-'}{Math.abs(tx.hours || 0)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">{tx.transactionType === 'credit' ? '+' : '-'}{Math.abs(tx.days || 0)}</TableCell>
                    <TableCell align="right">{tx.balanceHoursAfter || 0}</TableCell>
                    <TableCell align="right">{tx.balanceDaysAfter || 0}</TableCell>
                    <TableCell>
                      <Typography variant="caption" color="textSecondary">
                        {tx.createdBy?.firstName ? `${tx.createdBy.firstName} ${tx.createdBy.lastName || ''}`.trim() : '-'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ maxWidth: 280 }}>
                        {tx.remarks || '-'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Container>
  );
};
