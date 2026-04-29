
export const StudentStatus = {
    PRESENT: 'Present',
    ABSENT: 'Absent',
    LATE: 'Late',
    ON_BUS: 'On Bus'
};

export const BusStatus = {
    MOVING: 'Moving',
    STOPPED: 'Stopped',
    DELAYED: 'Delayed',
    OFFLINE: 'Offline'
};

export const MOCK_STUDENTS = [
    { id: 'S001', name: 'Alice Johnson', grade: '5A', status: StudentStatus.PRESENT, checkInTime: '07:55 AM', busRouteId: 'R-101', parentPhone: '+15550101', photoUrl: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Alice' },
    { id: 'S002', name: 'Bob Smith', grade: '5A', status: StudentStatus.ON_BUS, checkInTime: '07:30 AM', busRouteId: 'R-101', parentPhone: '+15550102', photoUrl: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Bob' },
    { id: 'S003', name: 'Charlie Davis', grade: '6B', status: StudentStatus.ABSENT, busRouteId: 'R-102', parentPhone: '+15550103', photoUrl: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Charlie' },
    { id: 'S004', name: 'Diana Evans', grade: '6B', status: StudentStatus.PRESENT, checkInTime: '08:00 AM', busRouteId: 'R-102', parentPhone: '+15550104', photoUrl: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Diana' },
    { id: 'S005', name: 'Evan Wright', grade: '4C', status: StudentStatus.LATE, checkInTime: '08:15 AM', busRouteId: 'R-103', parentPhone: '+15550105', photoUrl: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Evan' },
    { id: 'S006', name: 'Fiona Green', grade: '4C', status: StudentStatus.PRESENT, checkInTime: '07:50 AM', busRouteId: 'R-103', parentPhone: '+15550106', photoUrl: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Fiona' },
    { id: 'S007', name: 'George Hall', grade: '5A', status: StudentStatus.ABSENT, busRouteId: 'R-101', parentPhone: '+15550107', photoUrl: 'https://api.dicebear.com/9.x/avataaars/svg?seed=George' },
    { id: 'S008', name: 'Hannah Lee', grade: '5A', status: StudentStatus.PRESENT, checkInTime: '07:58 AM', busRouteId: 'R-101', parentPhone: '+15550108', photoUrl: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Hannah' },
];

export const MOCK_BUSES = [
    {
        id: 'B-11',
        driverName: 'John Doe',
        driverContact: '+1 (555) 012-3456',
        route: 'North Side (R-101)',
        status: BusStatus.MOVING,
        speed: 45,
        passengers: 24,
        capacity: 30,
        coordinates: { x: 20, y: 30 },
        routeCoordinates: [
            { x: 10, y: 10 }, { x: 15, y: 20 }, { x: 20, y: 30 }, { x: 25, y: 40 }, { x: 30, y: 60 }, { x: 40, y: 80 }
        ],
        fuelLevel: 78,
        nextStop: 'Maple Street',
        eta: '5 min'
    },
    {
        id: 'B-12',
        driverName: 'Jane Smith',
        driverContact: '+1 (555) 987-6543',
        route: 'South Side (R-102)',
        status: BusStatus.STOPPED,
        speed: 0,
        passengers: 28,
        capacity: 30,
        coordinates: { x: 60, y: 70 },
        routeCoordinates: [
            { x: 90, y: 90 }, { x: 80, y: 80 }, { x: 70, y: 75 }, { x: 60, y: 70 }, { x: 50, y: 65 }, { x: 40, y: 50 }
        ],
        fuelLevel: 45,
        nextStop: 'School Zone',
        eta: 'Arrived'
    },
    {
        id: 'B-13',
        driverName: 'Mike Brown',
        driverContact: '+1 (555) 456-7890',
        route: 'East End (R-103)',
        status: BusStatus.DELAYED,
        speed: 12,
        passengers: 15,
        capacity: 20,
        coordinates: { x: 80, y: 20 },
        routeCoordinates: [
            { x: 95, y: 10 }, { x: 90, y: 15 }, { x: 80, y: 20 }, { x: 60, y: 25 }, { x: 40, y: 40 }, { x: 20, y: 50 }
        ],
        fuelLevel: 92,
        nextStop: 'Oak Avenue',
        eta: '12 min'
    },
];
