// import React, { useState, useEffect, useRef } from 'react';
// import { Drawer, Box, Typography, Button, Grid, List, ListItemButton, Stack } from '@mui/material';

// export type DobChangeProps = {
//   year: number | null;
//   month: number | null;
//   day: number | null;
//   hour: number | null;
//   minute: number | null;
//   displayDobText: string;
//   valid: boolean;
// };

// export type DobPickerDrawerProps = {
//   open: boolean;
//   onClose: () => void;
//   onSelectChange: (data: DobChangeProps) => void;
//   year?: number;
//   month?: number;
//   day?: number;
//   hour?: number;
//   minute?: number;
// };

// const DobPicker: React.FC<DobPickerDrawerProps> = ({
//   open,
//   onClose,
//   onSelectChange,
//   year,
//   month,
//   day,
//   hour,
//   minute,
// }) => {
//   const now = new Date();
//   const [selected, setSelected] = useState<{
//     year: number | null;
//     month: number | null;
//     day: number | null;
//     hour: number | null;
//     minute: number | null;
//   }>({
//     year: year ?? null,
//     month: month ?? null,
//     day: day ?? null,
//     hour: hour ?? null,
//     minute: minute ?? null,
//   });

//   const months = [
//     'Jan',
//     'Feb',
//     'Mar',
//     'Apr',
//     'May',
//     'Jun',
//     'Jul',
//     'Aug',
//     'Sep',
//     'Oct',
//     'Nov',
//     'Dec',
//   ];

//   // Refs for each scrollable column
//   const listRefs = useRef<Record<string, HTMLUListElement | null>>({});

//   const years = Array.from({ length: now.getFullYear() - 1900 }, (_, i) => now.getFullYear() - i);

//   const getDaysInMonth = (y: number, m: number) => new Date(y, m + 1, 0).getDate();
//   let days = null;
//   if (selected.year !== undefined && selected.month !== undefined) {
//     days = Array.from({ length: getDaysInMonth(selected.year!, selected.month!) }, (_, i) => i + 1);
//   }

//   const hours = Array.from({ length: 24 }, (_, i) => i);
//   const minutes = Array.from({ length: 60 }, (_, i) => i);

//   const valid =
//     selected.year &&
//     selected.month !== null &&
//     selected.day &&
//     selected.hour !== null &&
//     selected.minute !== null;

//   const displayDobText =
//     valid && selected.year && selected.month && selected.day && selected.hour && selected.minute
//       ? new Date(
//           selected.year,
//           selected.month,
//           selected.day,
//           selected.hour,
//           selected.minute
//         ).toLocaleString('en-IN', {
//           day: '2-digit',
//           month: 'long',
//           year: 'numeric',
//           hour: '2-digit',
//           minute: '2-digit',
//           hour12: true,
//         })
//       : '';

//   const handleConfirm = () => {
//     if (!valid) {
//       onClose();
//       return;
//     }
//     onSelectChange({
//       ...selected,
//       displayDobText,
//       valid: !!valid,
//       year: selected.year ?? null,
//       month: selected.month ?? null,
//       day: selected.day ?? null,
//       hour: selected.hour ?? null,
//       minute: selected.minute ?? null,
//     });
//     onClose();
//   };

//   const handleSelect = (type: string, value: number) => {
//     setSelected((prev) => ({ ...prev, [type]: value }));
//   };

//   const handleClear = () => {
//     // Reset selected values
//     setSelected({ year: null, month: null, day: null, hour: null, minute: null });

//     // Notify parent
//     onSelectChange({
//       year: null,
//       month: null,
//       day: null,
//       hour: null,
//       minute: null,
//       displayDobText: '',
//       valid: false,
//     });

//     // Reset scroll positions of all lists
//     Object.values(listRefs.current).forEach((listEl) => {
//       if (listEl) listEl.scrollTo({ top: 0, behavior: 'smooth' });
//     });
//   };

//   const columnData = [
//     { label: 'Year', data: years, key: 'year' },
//     { label: 'Month', data: months, key: 'month' },
//     { label: 'Day', data: days, key: 'day' },
//     { label: 'Hour', data: hours, key: 'hour' },
//     { label: 'Minute', data: minutes, key: 'minute' },
//   ];

//   // 🔽 Auto-scroll when drawer opens
//   useEffect(() => {
//     if (!open) return;

//     setTimeout(() => {
//       columnData.forEach((col) => {
//         const list = listRefs.current[col.key];
//         if (!list) return;

//         const selectedIndex = col.data?.findIndex((item, i) => {
//           const compareValue = col.key === 'month' ? i : item;
//           return selected[col.key as keyof typeof selected] === compareValue;
//         });

//         if (selectedIndex !== undefined && selectedIndex >= 0 && list.children[selectedIndex]) {
//           const itemElement = list.children[selectedIndex] as HTMLElement;
//           itemElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
//         }
//       });
//     }, 200);
//   }, [open]);

//   return (
//     <Drawer
//       anchor="bottom"
//       open={open}
//       onClose={onClose}
//       PaperProps={{
//         sx: {
//           maxWidth: (theme) => theme.breakpoints.values.md,
//           margin: '0 auto',
//           borderTopLeftRadius: 16,
//           borderTopRightRadius: 16,
//           overflow: 'hidden',
//           width: { xs: '100%', sm: 500, md: 500 },
//         },
//       }}
//     >
//       {/* Header */}
//       <Box
//         display="flex"
//         justifyContent="space-between"
//         alignItems="center"
//         px={2}
//         py={1.5}
//         bgcolor="#f5f5f5"
//         borderBottom="1px solid #ddd"
//       >
//         <Typography variant="button" color="text.primary">
//           {valid ? (
//             <Box
//               sx={{
//                 lineHeight: '1.4em',
//               }}
//             >
//               {displayDobText.split(' at')[0]}

//               <br />
//               <span style={{ fontSize: '0.95em', fontWeight: 'normal' }}>
//                 {displayDobText.split(' at')[1]}
//               </span>
//             </Box>
//           ) : (
//             ''
//           )}
//         </Typography>

//         {/* Buttons (Clear + Confirm/Close) */}
//         <Stack direction="row" spacing={1}>
//           <Button variant="text" color="inherit" size="small" onClick={handleClear}>
//             Clear
//           </Button>
//           <Button variant="contained" color="warning" size="small" onClick={handleConfirm}>
//             {valid ? 'Confirm' : 'Close'}
//           </Button>
//         </Stack>
//       </Box>

//       {/* Columns */}
//       <Grid container>
//         {columnData.map((col) => (
//           <Grid item xs={12 / 5} key={col.key}>
//             <Box
//               sx={{
//                 maxHeight: 280,
//                 overflowY: 'auto',
//                 borderRight: '1px solid #eee',
//               }}
//             >
//               <List
//                 disablePadding
//                 ref={(el) => {
//                   listRefs.current[col.key] = el;
//                 }}
//               >
//                 {col.data?.map((item: string | number, i: number) => (
//                   <ListItemButton
//                     key={i}
//                     selected={
//                       selected[col.key as keyof typeof selected] ===
//                       (col.key === 'month' ? i : item)
//                     }
//                     onClick={() => handleSelect(col.key, Number(col.key === 'month' ? i : item))}
//                     sx={{
//                       textAlign: 'center',
//                       py: 0.8,
//                       '&.Mui-selected': {
//                         bgcolor: 'orange.100',
//                       },
//                     }}
//                   >
//                     <Typography variant="body2">
//                       {typeof item === 'number' && col.key !== 'month'
//                         ? item.toString().padStart(2, '0')
//                         : item}
//                     </Typography>
//                   </ListItemButton>
//                 ))}
//               </List>
//             </Box>
//           </Grid>
//         ))}
//       </Grid>
//     </Drawer>
//   );
// };

// export default DobPicker;
