<?php

namespace App\Domain\Leave\Notifications;

use App\Domain\Leave\Models\LeaveRequest;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Facades\URL;

class LeaveDecisionNotification extends Notification
{
    use Queueable;

    public function __construct(
        private readonly LeaveRequest $leaveRequest,
        private readonly string $decision,
        private readonly ?string $comment = null,
    ) {}

    /**
     * @return list<string>
     */
    public function via(object $notifiable): array
    {
        return ['database', 'mail', 'broadcast'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $data = $this->toArray($notifiable);

        return (new MailMessage)
            ->subject($data['title'])
            ->line($data['message'])
            ->line($this->comment ? 'Comment: '.$this->comment : '')
            ->action('View leave', URL::to($data['url']));
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        $type = $this->leaveRequest->leaveType->name;

        return [
            'title' => 'Leave '.$this->decision,
            'message' => 'Your '.$type.' request from '.$this->leaveRequest->start_date->toDateString().' to '.$this->leaveRequest->end_date->toDateString().' was '.$this->decision.'.',
            'comment' => $this->comment,
            'leave_request_id' => $this->leaveRequest->id,
            'url' => '/leave',
        ];
    }
}
