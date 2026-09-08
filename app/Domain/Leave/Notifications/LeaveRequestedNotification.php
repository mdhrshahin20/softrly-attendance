<?php

namespace App\Domain\Leave\Notifications;

use App\Domain\Leave\Models\LeaveRequest;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Facades\URL;

class LeaveRequestedNotification extends Notification
{
    use Queueable;

    public function __construct(private readonly LeaveRequest $leaveRequest) {}

    /**
     * @return list<string>
     */
    public function via(object $notifiable): array
    {
        return ['database', 'mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $data = $this->toArray($notifiable);

        return (new MailMessage)
            ->subject($data['title'])
            ->line($data['message'])
            ->action('Review leave', URL::to($data['url']));
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        $employee = $this->leaveRequest->employee;

        return [
            'title' => 'Leave request pending',
            'message' => $employee->full_name.' applied for '.$this->leaveRequest->total_days.' day(s) of '.$this->leaveRequest->leaveType->name.'.',
            'leave_request_id' => $this->leaveRequest->id,
            'url' => '/leave/'.$this->leaveRequest->id,
        ];
    }
}
