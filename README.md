# Module Quality Dashboard

A responsive, single-page dashboard for managing module test quality status. Built with Bootstrap 5 and Vanilla JavaScript.

## Features

- **Module Management**: Add, Edit, and Delete modules.
- **Status Tracking**: Track status (Passed, Failed, In Progress, Blocked), failure reasons, and counts.
- **Quick Actions**: Update status directly from the list with inline prompts.
- **Dashboard Summary**: Real-time aggregated KPIs (Total, Passed, Failed, Pass Rate).
- **Search & Filter**: Filter by status and search by module name.
- **Sorting**: Sort by Name, Status, or Failure Count.
- **Persistence**: Data is saved to `localStorage` automatically.
- **Backup**: Export and Import data as JSON.

## Setup & Usage

1. **Open the Dashboard**:
   Simply open `index.html` in any modern web browser. No server is required.

2. **Managing Modules**:
   - Click **Add Module** to create a new entry.
   - Click the **Edit** (pencil) icon to modify details.
   - Click the **Delete** (trash) icon to remove a module.

3. **Quick Status Update**:
   - Click the status badge in the table row to quickly change the status.
   - If setting to "Failed" or "Blocked", you will be prompted for a reason.

4. **Data Backup**:
   - Use the **Export** button in the top right to download a JSON backup.
   - Use the **Import** button to restore data from a JSON file.

## Technologies

- **HTML5**
- **CSS3** (Bootstrap 5 + Custom Styles)
- **JavaScript** (ES6+)
- **Font Awesome** (Bootstrap Icons)
- **Google Fonts** (Inter)

## License

MIT
