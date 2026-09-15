
setTimeout(() => {
    const table = document.getElementById('kt_ViewTable');
    if (table) {
        const rows = table.rows;
        const classes_needed = ["Classes Required\n(for 75% attendance)"];
        const absences_affordable = ["No. of classes \nyou can safely skip"];
        const absences_affordable_90 = ["Classes you can \nsafely skip (90%)"];
        let tablearr = arraygen(table);
        for (let i = 1; i < rows.length; i++) {
            let present, absent, total, classesNeeded, absencesAffordable, absencesAffordable90;
            present = tablearr[i][6];
            absent = tablearr[i][7];
            total = tablearr[i][8];

            classesNeeded = getClassesNeeded(present, total);
            absencesAffordable = getAbsencesAffordable(absent, total);
            absencesAffordable90 = getAbsencesAffordable90(absent, total);

            if (classesNeeded < 0) classesNeeded = 0;
            classes_needed.push(Math.ceil(classesNeeded));

            if (absencesAffordable < 0) absencesAffordable = 0;
            absences_affordable.push(Math.floor(absencesAffordable));

            if (absencesAffordable90 < 0) absencesAffordable90 = 0;
            absences_affordable_90.push(Math.floor(absencesAffordable90));
        }

        for (let i = 0; i < rows.length; i++) {
            let row = rows.item(i);
            let cn = row.insertCell(-1);
            cn.innerText = classes_needed[i];
            cn.style.textAlign = "center";

            let aa = row.insertCell(-1);
            aa.innerText = absences_affordable[i];
            aa.style.textAlign = "center";

            let aa90 = row.insertCell(-1);
            aa90.innerText = absences_affordable_90[i];
            aa90.style.textAlign = "center";
        }
    }
}, 2000);

function arraygen(table) {
    if (table) {
        const tableData = [];
        const rows = table.rows;
        for (let i = 0; i < rows.length; i++) {
            const rowData = [];
            const cells = rows[i].cells;
            for (let j = 0; j < cells.length; j++) {
                rowData.push(cells[j].textContent.trim());
            }
            tableData.push(rowData);
        }
        return tableData;
    }
}

function getClassesNeeded(present, total) {
    return (3 * total) - (4 * present);
}

function getAbsencesAffordable(absent, total) {
    return ((total - (4 * absent)) / 3);
}

function getAbsencesAffordable90(absent, total) {
    return ((total - (10 * absent)) / 9);
}
