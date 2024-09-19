<table>
    <thead>
        <tr>
            <th>Username</th>
            <th>Email</th>
        </tr>
    </thead>
    <tbody>
        @foreach($lecturers as $lecturer)
            <tr>
                <td>{{ $lecturer->name }}</td>
                <td>{{ $lecturer->email }}</td>
            </tr>
        @endforeach
    </tbody>
</table>
